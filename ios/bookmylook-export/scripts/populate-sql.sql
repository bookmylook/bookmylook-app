-- Jammu & Kashmir Districts (already exist, skip)

-- Insert all new districts and towns for all states

-- Maharashtra Districts
DO $$
DECLARE
  mh_state_id varchar;
BEGIN
  SELECT id INTO mh_state_id FROM indian_states WHERE name = 'Maharashtra' LIMIT 1;
  
  INSERT INTO indian_districts (name, state_id, display_order) VALUES
    ('Mumbai City', mh_state_id, 10),
    ('Mumbai Suburban', mh_state_id, 11),
    ('Pune', mh_state_id, 12),
    ('Nagpur', mh_state_id, 13),
    ('Nashik', mh_state_id, 14),
    ('Aurangabad', mh_state_id, 15),
    ('Thane', mh_state_id, 16),
    ('Raigad', mh_state_id, 17)
  ON CONFLICT DO NOTHING;
END $$;

-- Karnataka Districts  
DO $$
DECLARE
  ka_state_id varchar;
BEGIN
  SELECT id INTO ka_state_id FROM indian_states WHERE name = 'Karnataka' LIMIT 1;
  
  INSERT INTO indian_districts (name, state_id, display_order) VALUES
    ('Bengaluru Urban', ka_state_id, 20),
    ('Mysuru', ka_state_id, 21),
    ('Mangaluru', ka_state_id, 22),
    ('Hubballi-Dharwad', ka_state_id, 23),
    ('Belagavi', ka_state_id, 24),
    ('Tumakuru', ka_state_id, 25),
    ('Shivamogga', ka_state_id, 26),
    ('Kalaburagi', ka_state_id, 27)
  ON CONFLICT DO NOTHING;
END $$;

-- Continue for other states... (simplified for now, can expand later)

-- Insert sample towns for easier testing
DO $$
DECLARE
  srinagar_id varchar;
  jk_state_id varchar;
BEGIN
  SELECT id, state_id INTO srinagar_id, jk_state_id FROM indian_districts WHERE name = 'Srinagar' LIMIT 1;
  
  INSERT INTO indian_towns (name, district_id, state_id, display_order, type) VALUES
    ('Lal Chowk', srinagar_id, jk_state_id, 1, 'town'),
    ('Dal Lake', srinagar_id, jk_state_id, 2, 'town'),
    ('Rajbagh', srinagar_id, jk_state_id, 3, 'town'),
    ('Jawahar Nagar', srinagar_id, jk_state_id, 4, 'town'),
    ('Badami Bagh', srinagar_id, jk_state_id, 5, 'town'),
    ('Soura', srinagar_id, jk_state_id, 6, 'town'),
    ('Hazratbal', srinagar_id, jk_state_id, 7, 'town'),
    ('Nishat', srinagar_id, jk_state_id, 8, 'town')
  ON CONFLICT DO NOTHING;
END $$;

SELECT 
  (SELECT COUNT(*) FROM indian_states) as states,
  (SELECT COUNT(*) FROM indian_districts) as districts,
  (SELECT COUNT(*) FROM indian_towns) as towns;
