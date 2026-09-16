-- Run these in the Supabase SQL Editor (Project -> SQL Editor).
-- Additive/idempotent only: no existing tables, columns, or policies are touched,
-- and every view uses "create or replace" so it's safe to re-run this whole file
-- any time you update it (e.g. after this revision added the weekly/monthly views).

create or replace view admin_batches_by_stage as
select stage, count(*) as batch_count
from batches
group by stage;

create or replace view admin_sensor_alerts_by_day as
select date_trunc('day', created_at) as bucket, count(*) as alert_count
from notifications
where type = 'sensor_alert'
group by 1
order by 1;

create or replace view admin_sensor_alerts_by_week as
select date_trunc('week', created_at) as bucket, count(*) as alert_count
from notifications
where type = 'sensor_alert'
group by 1
order by 1;

create or replace view admin_sensor_alerts_by_month as
select date_trunc('month', created_at) as bucket, count(*) as alert_count
from notifications
where type = 'sensor_alert'
group by 1
order by 1;

create or replace view admin_transit_times as
select
  tr.id,
  tr.batch_id,
  tr.transporter_id,
  tr.origin_point,
  tr.destination_point,
  tr.departed_at,
  tr.arrived_at,
  extract(epoch from (tr.arrived_at - tr.departed_at)) / 3600 as transit_hours
from transport_records tr
where tr.departed_at is not null and tr.arrived_at is not null;

create or replace view admin_farmer_activity as
select p.id as farmer_id, p.name, count(b.id) as batch_count
from profiles p
left join batches b on b.farmer_id = p.id
where p.role = 'farmer'
group by p.id, p.name;

create or replace view admin_transporter_activity as
select p.id as transporter_id, p.name, count(tr.id) as delivery_count,
  avg(extract(epoch from (tr.arrived_at - tr.departed_at)) / 3600) as avg_transit_hours
from profiles p
left join transport_records tr on tr.transporter_id = p.id and tr.arrived_at is not null
where p.role = 'transporter'
group by p.id, p.name;

-- If querying these views as the logged-in admin returns empty/partial results,
-- the underlying tables' RLS policies are likely scoping rows to non-admin roles.
-- In that case, either add an admin-scoped RLS policy on each base table, or
-- recreate these as `security definer` functions instead of plain views.
