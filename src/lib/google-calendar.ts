import { getAccessToken } from "@/lib/google-drive";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface CalendarEventResult {
  eventId: string;
  eventUrl: string;
}

export async function createCalendarEvent(
  title: string,
  startTime: string,
  endTime: string,
  attendees: string[],
  notes: string
): Promise<CalendarEventResult> {
  const accessToken = await getAccessToken();

  const event = {
    summary: title,
    description: notes,
    start: {
      dateTime: startTime,
      timeZone: "America/New_York",
    },
    end: {
      dateTime: endTime,
      timeZone: "America/New_York",
    },
    attendees: attendees.filter(Boolean).map((email) => ({ email })),
  };

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${err}`);
  }

  const data = await res.json();
  return {
    eventId: data.id,
    eventUrl: data.htmlLink || `https://calendar.google.com/calendar/event?eid=${data.id}`,
  };
}
