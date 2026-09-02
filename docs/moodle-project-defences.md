# Teams, their teaching assistant, and the project defences in Moodle

A method note for whoever runs the projects. It was written by reconstructing
what earlier iterations actually did, because the person who set it up first has
left the team and nobody still on it remembered the mechanism.

**This file carries no course ids, no module ids, no links containing one, and
it names nobody.** It sits in a public repository. Ask the lecturer for the
actual course coordinates; the method is all here.

## What we want

1. Participants form their own teams.
2. Each team is assigned one teaching assistant.
3. That same assistant takes the team through **all three** project defences.
4. The team and the assistant agree between themselves when each defence happens.

## The mechanism, in one sentence

**There is ONE set of course groups. A participant joins a group to form a team,
and the assistant assigned to that team is added into the same group as a
member.**

Everything else follows from that. Because a single set of groups serves the
whole course, the team keeps its assistant across every project automatically,
with nothing to maintain between projects. Point 4 needs no Moodle feature at
all: once the participant can see who their assistant is, they write to them.

This is the pattern in the most recent run of this course, and the sister course
on AI in industry uses exactly the same one, with about twenty assistants each
sitting in a group.

## How it is built, in order

The order matters. Doing these in the wrong sequence is the main way to waste an
afternoon.

**1. Enrol the assistants with a teacher role.** They have to be in the course
before they can be put in a group. In the last run every assistant held the
plain `Teacher` role.

**2. Create the groups.** *Participants / Groups*, one per team, named plainly:
`Group A`, `Group B`, and so on. Create a few more than you expect to need. The
lecturer stays out of every group.

**3. Add the Group choice activity** (`Gruppenwahl` in the German interface,
which is what ETH's Moodle shows by default). It offers the groups that already
exist, which is why step 2 comes first. Settings that were used:

| Setting | Value | Effect |
|---|---|---|
| Publish results | Always show, full results with names | Everyone sees who is in which team |
| Allow choice to be updated | Yes | People can move while teams are still settling |
| Show column for unanswered | Yes | You can see who has not chosen yet |
| Limit the number of responses | **Disabled** | Team sizes were left to sort themselves out, and came out at two to four |

**4. Assign an assistant to each team.** *Participants / Groups*, pick the
group, *Add/remove users*, and add the assistant. One assistant can hold more
than one team; in the last run a couple of them held two.

**5. Point the project submissions at the same groups.** Each project hand-in is
an ordinary Assignment with:

| Setting | Value | Effect |
|---|---|---|
| Students submit in groups | **Yes** | One submission per team rather than per person |
| Require group to submit | **Yes** | Somebody outside a team is stopped early, with a clear message |
| Require all group members submit | No | One member uploads on behalf of the team |
| Grouping for student groups | none | Uses the course's default groups, which is what we want |
| **Group mode** | **Separate groups** | **This is the important one.** Each assistant sees only their own teams' submissions |

Separate groups is what turns a shared course into each assistant's private
worklist. Without it every assistant sees all submissions and has to find their
own by hand.

## Gotchas

- **The member count in Group choice includes the assistant.** A team of one
  participant plus their assistant displays as 2. So if you ever do turn on a
  per-group limit, add one to the team size you actually want, or the last
  participant is locked out of a team that looks full and is not.
- **Add the assistants after the teams have settled**, or at least be ready to
  move them. If you assign an assistant to an empty group and nobody picks it,
  you have to move them again.
- **An assistant who is not enrolled cannot be added to a group.** The group
  membership dialog only offers enrolled users, and the failure looks like the
  person simply missing from a list.
- **Removing somebody from a group does not remove their submission.** If a
  participant switches team after submitting, check the old team's hand-in.
- **The lecturer belongs in no group.** With separate groups on an assignment, a
  teacher with no group still sees everything, which is what you want.

## Arranging the defences themselves

Nothing further is needed. The participant sees their assistant in the group
list, and the two of them settle a time by mail. This is the lightest
arrangement and it is what we are doing.

**The alternative, for the record.** An earlier iteration ran the defences
through Moodle's **Scheduler** module (`Planer`), one instance per project, where
each assistant published bookable time slots and put their own meeting link in
the slot's Location field, because the module has no notion of a meeting room.
That is worth the extra machinery when defences are booked with whoever is free
rather than with a fixed assistant. With one assistant per team for the whole
course, it mostly adds a step. Note also that a course can hold a Scheduler
called something like "Office hours booking", which serves weekly office hours
and has nothing to do with defences: read the name before copying anything.

## If you ever need to script any of this

Hand work is fine at this size. If you do automate, two things about ETH's
Moodle are worth knowing, because each cost somebody a long afternoon:

- **The Shibboleth login cannot be automated.** The login page hangs in an
  automation browser and the session binds to the browser that created it. The
  working method is a normal Chrome launched with a remote debugging port and
  its own profile: you log in by hand once, and a script attaches to that
  already authenticated browser afterwards. The profile persists, so later runs
  reattach without a fresh login.
- **Waiting for the page to go network idle never returns**, because this Moodle
  holds a long poll open. Wait for the document instead, then read the page.
  Several settings also sit in collapsed form sections where typing into them
  hangs; setting the value directly and firing a change event works either way.
