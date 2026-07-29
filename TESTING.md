# Booth Testing Checklist — Fortune App

Run this on the actual booth notebook/PC + Chrome, 5-10 full rounds, before
Open House. Not for mobile — this app doesn't target mobile devices.

## Setup

- [ ] `npm run dev` starts cleanly on the booth machine (or confirm the
      Vercel deploy loads if using that as primary)
- [ ] Webcam is detected and the browser prompts for camera permission

## Happy path (repeat 5-10 times, varying the person each time)

- [ ] Consent gate appears on first load
- [ ] Consent gate appears again after a full page refresh (must NOT be
      remembered across reloads — this is a hard requirement, not a bug if
      it reappears)
- [ ] Camera opens after accepting consent
- [ ] Real-time overlay shows the correct one of its 4 states as you move:
      no face detected / tilted or too close-up-down / too far / "hold
      still" ready-to-capture
- [ ] Capture button is disabled until the overlay says ready
- [ ] Capturing shows a still preview of the captured frame
- [ ] Gender + age form validates (submit stays disabled until both fields
      are valid; typing an out-of-range age shows the Thai error message
      immediately, not just after clicking away from the field)
- [ ] Submitting shows a loading state, then all 4 result cards (career,
      love, health, finance) with Thai text
- [ ] The webcam's hardware LED turns off once you confirm the photo (it
      should not stay lit through the form/loading/results screens)
- [ ] "Print result" button opens the print dialog; preview is black text
      on white background (not the dark theme), the title
      "ผลคำทำนายโหงวเฮ้งของคุณ" is visible on the printed page, and no card
      is split across a page break

## Edge cases

- [ ] No face in frame -> overlay says so, capture stays blocked, no crash
- [ ] Camera permission denied -> friendly Thai error + a way to retry, not
      a raw browser error
- [ ] Open a second tab/app using the webcam, then try to open the camera
      here -> friendly "กล้องกำลังถูกใช้งานโดยโปรแกรมอื่นอยู่..." message,
      not the generic camera error
- [ ] Confirm the photo, then immediately click "retake" before the
      real-time check finishes — capture button must NOT get stuck
      permanently disabled (this was a fixed Ticket 9 race condition; watch
      for a regression)
- [ ] Confirm a photo (camera LED off), then click "ถ่ายใหม่" from that
      screen — the camera should re-open (brief "กำลังเปิดกล้อง..." is
      expected) and the live feed should resume, not stay frozen/black
- [ ] Submit the form, then immediately click "ถ่ายใหม่" while it's still
      loading — the loading request should be abandoned (no stale result
      popping in afterward) and the form should reset cleanly
- [ ] Leave the tab idle after capture for 10+ seconds without holding
      still — the "unavailable" fallback should eventually unlock the
      capture button instead of hanging forever
- [ ] Trigger a slow/failed network (throttle in DevTools or disconnect
      briefly) during the fortune request -> friendly Thai error within
      ~20 seconds, not a raw fetch error or an indefinitely frozen loading
      state
- [ ] (If reachable) trigger Gemini 429 by sending several requests back to
      back -> friendly "ผู้ใช้งานเยอะในขณะนี้ กรุณาลองใหม่อีกครั้ง" message,
      not a raw error

## Sign-off

- [ ] All of the above pass on the actual booth hardware, not just a dev
      machine
- [ ] Note the date and who ran the pass below

Date run: ____________  Run by: ____________  Rounds completed: _____ / 10
