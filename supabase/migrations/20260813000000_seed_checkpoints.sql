insert into public.checkpoints (sequence_order, qr_secret, title, clue_text)
values
  (1, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'The First Signal', 'Start where the NoLimit mark first catches your eye.'),
  (2, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'Concrete Current', 'Find the place where people pause while the city keeps moving.'),
  (3, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'The Bright Edge', 'Follow the brightest edge until you find the next signal.'),
  (4, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'Hidden Rhythm', 'Look for the spot where the background noise becomes a beat.'),
  (5, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'Open Space', 'Your next clue is waiting where the crowd has room to breathe.'),
  (6, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'Final Drop', 'You made it. Scan this final signal to unlock your reward.');
