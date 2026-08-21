import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAppointmentPrice,
  getAppointmentPriceInPaise,
  getServicePrice,
  getServicePriceInPaise,
} from '@/lib/servicePricing';

test('service pricing matches clinic rates', () => {
  assert.equal(getServicePrice('Counselling & Therapy'), 1200);
  assert.equal(getServicePrice('Child Counselling'), 1200);
  assert.equal(getServicePrice('Career Guidance'), 500);
  assert.equal(getServicePrice('Marital Counselling'), 1200);
  assert.equal(getServicePrice('Relationship Counselling'), 1200);

  assert.equal(getServicePriceInPaise('Career Guidance'), 50000);
  assert.equal(getServicePriceInPaise('Counselling & Therapy'), 120000);
});

test('appointment pricing applies 5% online discount and respects session duration', () => {
  assert.equal(getAppointmentPrice('Counselling & Therapy', 'offline', 60), 1200);
  assert.equal(getAppointmentPrice('Counselling & Therapy', 'online', 60), 1140);
  assert.equal(getAppointmentPrice('Career Guidance', 'online', 60), 475);
  assert.equal(getAppointmentPriceInPaise('Career Guidance', 'online', 60), 47500);
  assert.equal(getAppointmentPrice('Marriage Counselling', 'offline', 90), 1800);
});
