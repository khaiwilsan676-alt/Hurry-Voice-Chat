1. **Wallet Updates**:
   - In `components/Wallet.tsx`, add an exported function `deductCoinsFromDB(amount)` that connects to IndexedDB (`FruitPartyDB`, `GameState` store) and deducts coins. Make sure it doesn't drop below 0 if they don't have enough balance.

2. **Store Purchases & Equipment**:
   - In `components/StorePage.tsx`, update the `handleBuy` logic (currently just an empty placeholder logic or missing). When a user clicks 'Buy', read their balance. If they have enough, deduct the item's price via `deductCoinsFromDB`, and save the item ID to a `localStorage` array (e.g. `ownedItems`).
   - Update the 'Equip' button logic to save the equipped item URL/ID based on its category in `localStorage` (e.g. `equipped_Vehicle`, `equipped_Chat Bubble`). Show a checkmark or update button text to "Equipped".

3. **Entry Effect**:
   - Create a `components/EntryEffect.tsx` that will be rendered when a user joins the room.
   - In `components/RoomPage.tsx`, around line 2074 where `msg.type === 'join'` is rendered, if the user has an `equippedVehicle` (we'll add this to the socket payload), render the `<EntryEffect />` animation overlaid on the screen (as an entry card).
   - Update `sendMessageToSocket` in `RoomPage.tsx` to include `equippedVehicle` (from `localStorage.getItem('equipped_Vehicle')`) when `type` is `"join"`. Include this in the socket payload.

4. **Chat Bubble Background**:
   - In `components/RoomPage.tsx`, add `equippedBubble` to `Message` interface.
   - Update `sendMessageToSocket` to read `localStorage.getItem('equipped_Chat Bubble')` and send it as `equippedBubble` with standard messages.
   - In the chat rendering loop (around line 2115 for standard text messages), check if `msg.equippedBubble` is present. If it is, render a `div` wrapped with a style that sets `backgroundImage: url(...)` and `backgroundSize: '100% 100%'`. Since we need it to adjust to width and height automatically, standard background stretch works perfectly. Ensure padding is appropriate so text fits nicely inside the bubble.

5. **Pre-commit checks**:
   - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
