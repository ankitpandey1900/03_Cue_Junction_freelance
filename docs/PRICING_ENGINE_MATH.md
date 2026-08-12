# Pricing Engine Mathematics

This document details the exact mathematical formulas used by the server to calculate final billing costs for live table sessions. The system guarantees absolute precision by keeping all logic server-side and diffing timestamps rather than trusting client-side timers.

## 1. Time Calculation

The core of the billing engine is calculating the exact billable minutes.

### 1.1 Gross Play Time
The gross duration is the absolute time difference between when the session started and when it ended.
$$ T_{\text{gross\_seconds}} = \text{endTime} - \text{startTime} $$

### 1.2 Net Play Time (Billable Time)
We must deduct any time the session spent in a `PAUSED` state.
$$ T_{\text{net\_seconds}} = T_{\text{gross\_seconds}} - \text{totalPauseDurationSeconds} $$

### 1.3 Rounding to Minutes
The engine bills by the minute. It drops fractional seconds using `Math.floor`.
$$ T_{\text{minutes}} = \left\lfloor \frac{T_{\text{net\_seconds}}}{60} \right\rfloor $$
*Note: If the session lasted less than 60 net seconds, the system defaults to a minimum of `1` billable minute to prevent zero-minute billing.*

---

## 2. Base Cost Calculation

Once $T_{\text{minutes}}$ is determined, the engine applies the pricing rules from the `TableType` table.

### Case A: Standard Hourly Billing
If the table has no advanced pricing packages (no `fixedRate` or `fixedDuration`), the system applies a standard linear hourly rate.

$$ \text{Cost} = \left( \frac{T_{\text{minutes}}}{60} \right) \times \text{hourlyRate} $$

### Case B: Advanced Package Billing (Prepaid/Fixed Rates)
Some tables (like VIP PS5 rooms) might have a fixed upfront cost for the first N minutes, followed by an overtime rate.

Let:
- $F_r = \text{fixedRate}$
- $F_d = \text{fixedDuration}$ (in minutes)
- $O_r = \text{overtimeHourlyRate}$

If the player stays **within** the fixed duration ($T_{\text{minutes}} \le F_d$):
$$ \text{Cost} = F_r $$

If the player **exceeds** the fixed duration ($T_{\text{minutes}} > F_d$):
$$ T_{\text{overtime\_minutes}} = T_{\text{minutes}} - F_d $$
$$ \text{Cost} = F_r + \left( \frac{T_{\text{overtime\_minutes}}}{60} \right) \times O_r $$

---

## 3. Modifiers & Extra Charges

After the base cost is calculated, the system applies additional parameters stored on the session.

### 3.1 Minimum Charge Floor
If the calculated base `Cost` is less than the table's `minimumCharge` setting, the cost is bumped up to the floor limit.
$$ \text{Cost} = \max(\text{Cost}, \text{minimumCharge}) $$

### 3.2 Extra Hourly Rates (e.g. Extra Players)
If the session has an `extraHourlyRate` (for example, ₹50 extra per hour for a 3rd player), it is applied linearly against the total net play time.
$$ \text{ExtraRateCost} = \left( \frac{T_{\text{minutes}}}{60} \right) \times \text{extraHourlyRate} $$
$$ \text{Cost} = \text{Cost} + \text{ExtraRateCost} $$

### 3.3 Flat Extra Charges
Any manual, flat one-time fees (like a spilled drink penalty) applied via `extraCharges` are added directly.
$$ \text{Cost} = \text{Cost} + \text{extraCharges} $$

---

## 4. Table Switching Mathematics

When a player moves from Table A to Table B mid-session, the server calculates the exact cost incurred on Table A using the math above, and stores it in the `accumulatedCost` field. 

The session timer is then reset to `now()` for Table B. When the session finally ends on Table B, the system calculates the cost for the time spent on Table B, and adds the historical snapshotted costs.

$$ \text{Final Session Cost} = \text{Cost}_{(\text{Table B})} + \text{accumulatedCost} $$

---

## 5. Final Invoice Generation

The table session cost is just one half of the final bill. The other half is Cafe POS orders.

$$ \text{Grand Total} = \text{Final Session Cost} + \sum \text{CustomerOrder.total} $$

*(Note: Taxes and discounts are applied mathematically to this Grand Total based on the CafeSettings before generating the final invoice).*
