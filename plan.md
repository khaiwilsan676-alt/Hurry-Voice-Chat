1. **Update `GiftPicker` Component:**
   - Modify `components/GiftPicker.tsx` to accept a `seats` prop (an array of seat objects).
   - In the "All" strip (`div` with `border-b`), add a horizontally scrollable list of avatars for users who are currently occupying a seat.
   - Keep the "All" text on the right side.

2. **Update `RoomPage` Component:**
   - In `components/RoomPage.tsx`, find where `GiftPicker` is rendered.
   - Pass the `seats` state variable to the `GiftPicker` component.

3. **Pre-commit Checks:**
   - Ensure the code changes are correctly applied and verify the UI logic using testing instructions to make sure proper testing, verifications, reviews and reflections are done.
