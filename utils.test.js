import { sum } from './utils';

test('sum adds two positive numbers', () => {
  expect(sum(1, 2)).toBe(3);
});

test('sum adds two negative numbers', () => {
  expect(sum(-1, -2)).toBe(-3);
});

test('sum adds a positive and a negative number', () => {
  expect(sum(1, -2)).toBe(-1);
});

test('sum adds zero and a number', () => {
  expect(sum(0, 5)).toBe(5);
});

test('sum adds two zeros', () => {
  expect(sum(0, 0)).toBe(0);
});