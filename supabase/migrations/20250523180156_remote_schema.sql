create table "public"."game_rooms" (
    "id" uuid not null default uuid_generate_v4(),
    "host_id" uuid,
    "status" text default 'waiting'::text,
    "players" jsonb default '[]'::jsonb,
    "game_state" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "winner_id" uuid,
    "card_collected" text,
    "game_initialized" boolean default false
);


alter table "public"."game_rooms" enable row level security;

create table "public"."player_states" (
    "id" uuid not null default uuid_generate_v4(),
    "game_id" uuid,
    "user_id" uuid,
    "hand" jsonb not null,
    "last_received" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."player_states" enable row level security;

create table "public"."players" (
    "id" uuid not null,
    "user_name" text,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "last_login" timestamp with time zone default now()
);


alter table "public"."players" enable row level security;

CREATE UNIQUE INDEX game_rooms_pkey ON public.game_rooms USING btree (id);

CREATE UNIQUE INDEX player_states_game_id_user_id_key ON public.player_states USING btree (game_id, user_id);

CREATE UNIQUE INDEX player_states_pkey ON public.player_states USING btree (id);

CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id);

alter table "public"."game_rooms" add constraint "game_rooms_pkey" PRIMARY KEY using index "game_rooms_pkey";

alter table "public"."player_states" add constraint "player_states_pkey" PRIMARY KEY using index "player_states_pkey";

alter table "public"."players" add constraint "players_pkey" PRIMARY KEY using index "players_pkey";

alter table "public"."game_rooms" add constraint "game_rooms_host_id_fkey" FOREIGN KEY (host_id) REFERENCES auth.users(id) not valid;

alter table "public"."game_rooms" validate constraint "game_rooms_host_id_fkey";

alter table "public"."player_states" add constraint "player_states_game_id_fkey" FOREIGN KEY (game_id) REFERENCES game_rooms(id) ON DELETE CASCADE not valid;

alter table "public"."player_states" validate constraint "player_states_game_id_fkey";

alter table "public"."player_states" add constraint "player_states_game_id_user_id_key" UNIQUE using index "player_states_game_id_user_id_key";

alter table "public"."player_states" add constraint "player_states_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."player_states" validate constraint "player_states_user_id_fkey";

alter table "public"."players" add constraint "players_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."players" validate constraint "players_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_or_updated_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.players (id, full_name, user_name, avatar_url, last_login)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'user_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    user_name = excluded.user_name,
    avatar_url = excluded.avatar_url,
    last_login = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.players (id, user_name, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    user_name = excluded.user_name,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;
    
  return new;
end;
$function$
;

grant delete on table "public"."game_rooms" to "anon";

grant insert on table "public"."game_rooms" to "anon";

grant references on table "public"."game_rooms" to "anon";

grant select on table "public"."game_rooms" to "anon";

grant trigger on table "public"."game_rooms" to "anon";

grant truncate on table "public"."game_rooms" to "anon";

grant update on table "public"."game_rooms" to "anon";

grant delete on table "public"."game_rooms" to "authenticated";

grant insert on table "public"."game_rooms" to "authenticated";

grant references on table "public"."game_rooms" to "authenticated";

grant select on table "public"."game_rooms" to "authenticated";

grant trigger on table "public"."game_rooms" to "authenticated";

grant truncate on table "public"."game_rooms" to "authenticated";

grant update on table "public"."game_rooms" to "authenticated";

grant delete on table "public"."game_rooms" to "service_role";

grant insert on table "public"."game_rooms" to "service_role";

grant references on table "public"."game_rooms" to "service_role";

grant select on table "public"."game_rooms" to "service_role";

grant trigger on table "public"."game_rooms" to "service_role";

grant truncate on table "public"."game_rooms" to "service_role";

grant update on table "public"."game_rooms" to "service_role";

grant delete on table "public"."player_states" to "anon";

grant insert on table "public"."player_states" to "anon";

grant references on table "public"."player_states" to "anon";

grant select on table "public"."player_states" to "anon";

grant trigger on table "public"."player_states" to "anon";

grant truncate on table "public"."player_states" to "anon";

grant update on table "public"."player_states" to "anon";

grant delete on table "public"."player_states" to "authenticated";

grant insert on table "public"."player_states" to "authenticated";

grant references on table "public"."player_states" to "authenticated";

grant select on table "public"."player_states" to "authenticated";

grant trigger on table "public"."player_states" to "authenticated";

grant truncate on table "public"."player_states" to "authenticated";

grant update on table "public"."player_states" to "authenticated";

grant delete on table "public"."player_states" to "service_role";

grant insert on table "public"."player_states" to "service_role";

grant references on table "public"."player_states" to "service_role";

grant select on table "public"."player_states" to "service_role";

grant trigger on table "public"."player_states" to "service_role";

grant truncate on table "public"."player_states" to "service_role";

grant update on table "public"."player_states" to "service_role";

grant delete on table "public"."players" to "anon";

grant insert on table "public"."players" to "anon";

grant references on table "public"."players" to "anon";

grant select on table "public"."players" to "anon";

grant trigger on table "public"."players" to "anon";

grant truncate on table "public"."players" to "anon";

grant update on table "public"."players" to "anon";

grant delete on table "public"."players" to "authenticated";

grant insert on table "public"."players" to "authenticated";

grant references on table "public"."players" to "authenticated";

grant select on table "public"."players" to "authenticated";

grant trigger on table "public"."players" to "authenticated";

grant truncate on table "public"."players" to "authenticated";

grant update on table "public"."players" to "authenticated";

grant delete on table "public"."players" to "service_role";

grant insert on table "public"."players" to "service_role";

grant references on table "public"."players" to "service_role";

grant select on table "public"."players" to "service_role";

grant trigger on table "public"."players" to "service_role";

grant truncate on table "public"."players" to "service_role";

grant update on table "public"."players" to "service_role";

create policy "Host can create room"
on "public"."game_rooms"
as permissive
for insert
to public
with check ((auth.uid() = host_id));


create policy "Public read access to game_rooms"
on "public"."game_rooms"
as permissive
for select
to public
using (true);


create policy "Allow service role to insert player states"
on "public"."player_states"
as permissive
for insert
to public
with check ((((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text));


create policy "Users can update their own state"
on "public"."player_states"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own state"
on "public"."player_states"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "deny all access"
on "public"."players"
as permissive
for all
to public
using (false)
with check (false);



