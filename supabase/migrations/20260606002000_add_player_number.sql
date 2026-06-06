alter table public.players
add column player_number integer;

alter table public.players
add constraint players_player_number_range
check (player_number is null or (player_number >= 0 and player_number <= 99));
