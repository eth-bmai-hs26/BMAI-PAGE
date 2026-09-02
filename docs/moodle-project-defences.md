# How the project defences are organised in Moodle

A method note for whoever runs the project defences. It was written by
reconstructing what an earlier iteration did, because the person who originally
set it up has left the team and nobody still on it remembered the mechanism.

**This file carries no course ids, no module ids and no links that contain one,
and it names nobody.** It sits in a public repository. Ask the lecturer for the
actual course coordinates; everything else you need is here.

## The short answer

The activity is Moodle's **Scheduler**. In the German interface, which is what
ETH's Moodle shows by default, it is called **"Planer"**. You find it under
*Add an activity or resource* / *Aktivität oder Material anlegen*.

The shape is **one Scheduler per project that has a defence**. An iteration with
three defended projects has three of them, named for the project they belong to.
Each teaching assistant then opens time slots inside those Schedulers, and each
participant books exactly one slot per project.

## Three things that are easy to confuse with it

Look at the activity list of an older course and you can pick the wrong one.

| You may see | What it actually does |
|---|---|
| A Scheduler called something like "Office hours booking" | Weekly office hours. Same module, different purpose, and it lives for the whole semester rather than for one project |
| A **Group choice** activity ("Gruppenwahl") | Forming the project pairs and groups. It has nothing to do with the defences |
| An **Assignment** ("Aufgabe") per project | The code hand-in. The defence is the live conversation that follows it |

So a course can hold a Scheduler that is *not* about defences at all. Read the
name and the slot dates before copying anything.

## Settings

Create the Scheduler, then set these. Everything else can stay at its default.

| Setting (German label) | Value | Why |
|---|---|---|
| Name | `Project N Presentation Slots` | Numbered, so the three are told apart at a glance |
| Maximum bookings (`Buchungen je Teilnehmer/in`) | **1** | One defence per project per person |
| Mode (`Modus`) | **one booking in this scheduler** (`in diesem Planer`) | Frees the slot again if somebody cancels |
| Guard time (`Sperrfrist`) | **0 minutes** | Participants can still rebook late. Raise it if late cancellations become a problem |
| Default slot duration (`Standarddauer`) | **15 minutes** | See the note below, the earlier iteration used a different number |
| Notifications (`Benachrichtigungen`) | **Yes** | The assistant is emailed when somebody books or cancels. Without this they have to keep checking the page |
| Notes (`Bemerkungen`) | **confidential, teachers only** (`Vertrauliche Bemerkung`) | Where the assistant records how the defence went, without the participant reading it |
| Booking form / student notes | **No** / **No** | Nothing for the participant to fill in beyond taking the slot |
| Grade (`Bewertung`) | **None** | The defences are pass or fail and are tracked outside Moodle |
| Group mode | **No groups** | |

**On the slot duration.** The earlier iteration used 25 minute slots with two
participants booked into each, so a pair defended together. The value above is
15, because that is the length this semester's administration slides announce to
participants. Change it if the pair convention comes back. It only prefills the
box when an assistant adds a slot, so it is a one field edit and any slot can
override it.

## What each teaching assistant then does

The Scheduler is empty when it is created. It fills up because each assistant
adds their own slots.

1. Open the Scheduler and choose **Add slots** (`Zeitfenster hinzufügen`). The
   repeating variant is worth using: it lays down a whole run of evenings at
   once.
2. Set the date and time. The earlier iteration ran defences on weekday
   evenings, in the same window as office hours.
3. Put **your own meeting link in the Location field** (`Ort`). This is the part
   that surprises people: the Scheduler has no notion of a meeting room, so the
   link is simply text in that field, and the participant reads it off the slot
   they booked. Every assistant therefore uses their own link, and slots run in
   parallel without collision.
4. Set the capacity. One participant per slot for individual defences, two if
   pairs defend together.

Participants then open the Scheduler and click a free slot. They see who runs it
and where it happens. The assistant gets an email.

## Traps worth knowing before you start

- **Create the Scheduler before asking anyone to add slots.** An assistant who
  opens a Scheduler that does not exist yet will make a second one, and then the
  bookings are split across two activities with nobody noticing until somebody
  turns up in an empty room.
- **The location field is free text.** A typo in a meeting link fails silently
  and only at the moment of the defence. Paste, never type.
- **Notifications default to off.** Turning them on afterwards does nothing for
  bookings that were already made, so set it when you create the activity.
- **Confidential notes are the right setting for defence remarks.** The other
  option shows the note to the participant.
- **Deleting a slot deletes its bookings** with no warning worth the name. To
  move a slot, edit it rather than deleting and recreating.

## If you ever need to do this in bulk

Creating three Schedulers by hand takes a few minutes and hand work is fine.
Driving Moodle from a script is possible and there is a house toolkit for it,
grown in the exam repositories. Two things about it are worth repeating here,
because both cost somebody a long afternoon:

- **ETH Shibboleth login cannot be automated.** The login page hangs in an
  automation browser and the session binds to the browser that created it. The
  working method is a normal Chrome launched with a remote debugging port and
  its own profile; you log in by hand once, and the script attaches to that
  already authenticated browser afterwards. The profile persists, so later runs
  reattach without a fresh login.
- **Several fields on the Scheduler settings form sit in collapsed sections.**
  A script that types into them the ordinary way hangs. Setting the value
  directly and firing a change event works whether or not the section is open.

Waiting for the page to go network idle is a third trap: this Moodle holds a
long poll open, so that wait never returns. Wait for the document instead and
then read the page.
