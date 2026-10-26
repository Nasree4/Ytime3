import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportRows, parseCheckResult, scopedKey, ownsKey, findIncompleteShifts, dueReminders, historyHasCheck } from '../lib/attendance.ts';

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

const at = (date, time, status, cet = 'working1') => ({ chk_date: date, chk_time: time, chk_status: status, chk_cet: cet });

test('incomplete shifts list missing IN/OUT but not a shift still in progress', () => {
  const history = [
    at('2026-10-20', '08:00:00', 'IN'), at('2026-10-20', '16:01:00', 'OUT'),
    at('2026-10-21', '08:02:00', 'IN'),
    at('2026-10-22', '16:05:00', 'OUT'),
    at('2026-10-23', '16:00:00', 'IN', 'working2'), at('2026-10-24', '00:10:00', 'OUT', 'working2'),
    at('2026-10-27', '08:00:00', 'IN'),
  ];
  const result = findIncompleteShifts(history, { date: '2026-10-27', time: '10:00' });
  assert.deepEqual(result.map((r) => `${r.date}_${r.missing}`), ['2026-10-22_IN', '2026-10-21_OUT']);
  assert.equal(findIncompleteShifts(history, { date: '2026-10-27', time: '17:30' })[0].date, '2026-10-27');
  assert.equal(findIncompleteShifts(history, { date: '2026-12-27', time: '10:00' }).length, 0);
});

test('reminders fire before a shift starts and around its end only when needed', () => {
  assert.deepEqual(dueReminders([], { date: '2026-10-27', time: '07:50' }).map((r) => r.key), ['2026-10-27_working1_IN']);
  assert.equal(dueReminders([at('2026-10-27', '07:48:00', 'IN')], { date: '2026-10-27', time: '07:50' }).length, 0);
  assert.equal(dueReminders([], { date: '2026-10-27', time: '12:00' }).length, 0);
  const onShift = [at('2026-10-27', '08:00:00', 'IN')];
  assert.deepEqual(dueReminders(onShift, { date: '2026-10-27', time: '16:10' }).map((r) => r.key), ['2026-10-27_working1_OUT', '2026-10-27_working2_IN']);
  assert.equal(dueReminders([...onShift, at('2026-10-27', '16:05:00', 'OUT')], { date: '2026-10-27', time: '16:10' }).some((r) => r.status === 'OUT'), false);
  assert.deepEqual(dueReminders([], { date: '2026-10-27', time: '23:50' }).map((r) => r.key), ['2026-10-28_working3_IN']);
  const afternoon = [at('2026-10-27', '16:00:00', 'IN', 'working2')];
  assert.deepEqual(dueReminders(afternoon, { date: '2026-10-28', time: '00:20' }).map((r) => r.key), ['2026-10-27_working2_OUT', '2026-10-28_working3_IN']);
});

test('check confirmation looks for a matching stamp in fresh history', () => {
  const history = [at('2026-10-27', '08:01:30', 'IN')];
  assert.equal(historyHasCheck(history, '2026-10-27', 'working1', '08:02'), true);
  assert.equal(historyHasCheck(history, '2026-10-27', 'working1', '09:00'), false);
  assert.equal(historyHasCheck(history, '2026-10-27', 'working2', '08:02'), false);
});
