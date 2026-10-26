import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportRows, parseCheckResult, scopedKey, ownsKey } from '../lib/attendance.ts';

const alice = { nid: 'person-a', udid: 'device-a' };
const bob = { nid: 'person-b', udid: 'device-b' };
const record = (time, status) => ({ chk_date: '2026-10-01', chk_time: time, chk_status: status, chk_cet: 'working1' });
const records = [record('08:00:00', 'IN'), record('16:00:00', 'OUT')];
const rows = (profile = alice, overrides = {}, custom = [], meta = {}, deleted = [], month = '2026-10', source = records) => buildReportRows(source, profile, month, overrides, custom, meta, deleted);

test('only explicit server confirmations count as successful attendance', () => {
  assert.equal(parseCheckResult({ message: '[001-IN]' }).status, 'confirmed');
  assert.match(parseCheckResult({ message: '[001-OUT]' }).message, /OUT/);
  for (const data of [null, {}, { success: true }, { message: '[001-FULL]' }, { message: '[002-QRCODE]' }, { message: '[003-UNREG]' }, { error: 'Denied', message: '[001-IN]' }]) {
    assert.equal(parseCheckResult(data).status, 'unknown');
  }
});

test('personnel overrides and legacy values never leak to another person', () => {
  const overrides = { '2026-10-01_working1_IN': '01:00:00', [scopedKey(alice, '2026-10-01_working1_IN')]: '09:00:00' };
  assert.equal(rows(alice, overrides)[0].time_in, '09:00:00');
  assert.equal(rows(bob, overrides)[0].time_in, '08:00:00');
  assert.equal(rows(alice, { '2026-10-02_working1_IN': '01:00:00' }).length, 1);
  assert.equal(rows(alice, { 'person-a_2026-10-01_working1_IN': '09:30:00' })[0].time_in, '09:30:00');
  assert.equal(rows(bob, { 'person-a_2026-10-01_working1_IN': '09:30:00' })[0].time_in, '08:00:00');
  const prefixPerson = { nid: 'person', udid: 'other' };
  const childPerson = { nid: 'person_child', udid: 'child-device' };
  const scoped = { [scopedKey(childPerson, '2026-10-02_working1_IN')]: '10:00:00' };
  assert.equal(rows(prefixPerson, scoped).length, 1);
  assert.equal(ownsKey(prefixPerson, scopedKey(childPerson, 'custom-1')), false);
});

test('edits move a row across months/shifts and allow clearing either time', () => {
  const key = rows()[0].rowKey;
  const meta = { [scopedKey(alice, key)]: { date: '2026-11-02', shift: 'working2', time_in: '-', time_out: '-', note: 'edited' } };
  assert.equal(rows(alice, {}, [], meta).length, 0);
  const edited = rows(alice, {}, [], meta, [], '2026-11')[0];
  assert.equal(edited.shift, 'working2');
  assert.equal(edited.time_in, '-');
  assert.equal(edited.time_out, '-');
  assert.equal(rows(bob, {}, [], meta)[0].note, '-');
});

test('same-day repeated shifts have separate edit/delete keys stable across new history', () => {
  const source = [...records, record('17:00:00', 'IN'), record('20:00:00', 'OUT')];
  const initial = rows(alice, {}, [], {}, [], '2026-10', source);
  const key = initial[1].rowKey;
  const meta = { [scopedKey(alice, key)]: { time_out: '21:00:00' } };
  const edited = rows(alice, {}, [], meta, [], '2026-10', source);
  assert.equal(edited[0].time_out, '16:00:00');
  assert.equal(edited[1].time_out, '21:00:00');
  const extended = rows(alice, {}, [], meta, [], '2026-10', [record('06:00:00', 'IN'), record('07:00:00', 'OUT'), ...source]);
  assert.equal(extended.find((row) => row.rowKey === key).time_out, '21:00:00');
  assert.equal(rows(alice, {}, [], {}, [scopedKey(alice, key)], '2026-10', source).length, 1);
});

test('custom rows, deletions, and restore are scoped and retain custom content', () => {
  const custom = [{ ...rows()[0], id: 'custom-1', profileId: alice.nid, time_in: '10:00:00' }, { ...rows()[0], id: 'unknown-owner', profileId: '' }];
  assert.equal(rows(alice, {}, custom).length, 2);
  assert.equal(rows(bob, {}, custom).length, 1);
  const deleted = [scopedKey(alice, 'custom-1'), scopedKey(bob, rows()[0].rowKey)];
  assert.equal(rows(alice, {}, custom, {}, deleted).length, 1);
  const restored = deleted.filter((key) => !ownsKey(alice, key));
  assert.equal(rows(alice, {}, custom, {}, restored).length, 2);
  assert.equal(rows(bob, {}, custom, {}, restored).length, 0);
});

test('API history order does not split paired shifts', () => {
  const result = rows(alice, {}, [], {}, [], '2026-10', [...records].reverse());
  assert.equal(result.length, 1);
  assert.equal(result[0].time_out, '16:00:00');
});
