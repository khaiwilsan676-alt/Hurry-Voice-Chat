const handleCardClick = async () => {
    setEnteredFromKept(false);

    const rawAccNum = localStorage.getItem('accountNumber') || getOrCreateAccountNumber(userUID)
    const storedAccNum = typeof rawAccNum === 'string' ? rawAccNum : (rawAccNum as any).fullAccNum

    if (isRoomCreated && myRoom) {
      let currentRoomName = myRoom.name;
      if (!currentRoomName || currentRoomName === 'My Room' || currentRoomName === 'My room') {
        currentRoomName = userName ? `${userName}'s Room` : 'Voice Chat Room';
      }
      let currentRoomDp = myRoom.image;
      if (!currentRoomDp || currentRoomDp === 'undefined' || currentRoomDp === 'null' || currentRoomDp === '/default-avatar.png') {
        currentRoomDp = userPhoto || localStorage.getItem('userPhoto') || '/default-avatar.png';
      }

      let finalRoomName = currentRoomName;
      let finalRoomDp = currentRoomDp;

      const updatedMyRoom = {
        ...myRoom,
        id: storedAccNum,
        name: finalRoomName,
        image: finalRoomDp,
        accountId: storedAccNum
      };

      setMyRoom(updatedMyRoom);
      localStorage.setItem('myRoom', JSON.stringify(updatedMyRoom));

      addToRecent({ 
        name: updatedMyRoom.name,
        image: updatedMyRoom.image,
        accountId: updatedMyRoom.accountId
      })
      setSelectedUser(updatedMyRoom)
      setCurrentPage('room')

      // Refresh room details in the background without blocking the room entry.
      void (async () => {
        try {
          const mongoRoom = await fetchRoomFromMongoDB(storedAccNum);
          if (!mongoRoom) return;

          const mName = mongoRoom['Room Name'] || mongoRoom.roomName || mongoRoom.name;
          const mDp = mongoRoom['Room dp'] || mongoRoom.roomDp || mongoRoom.image;

          if (mName && mName !== 'My Room' && mName !== 'My room' && mName !== 'User') {
            const refreshed = { ...updatedMyRoom, name: mName };
            setMyRoom(refreshed);
            localStorage.setItem('myRoom', JSON.stringify(refreshed));
            setSelectedUser(refreshed);
          }

          if (mDp && mDp !== 'undefined' && mDp !== 'null') {
            const refreshed = { ...updatedMyRoom, image: mDp };
            setMyRoom(refreshed);
            localStorage.setItem('myRoom', JSON.stringify(refreshed));
            setSelectedUser(refreshed);
          }
        } catch (err) {
          console.warn('Error fetching room from MongoDB in create room check:', err);
        }
      })();
      return;
    }

    let defaultRoomName = userName ? `${userName}'s Room` : "Voice Chat Room"
    let defaultRoomDp = userPhoto || localStorage.getItem('userPhoto') || '/default-avatar.png'

    try {
      const mongoRoom = await fetchRoomFromMongoDB(storedAccNum);
      if (mongoRoom) {
        const mName = mongoRoom['Room Name'] || mongoRoom.roomName || mongoRoom.name;
        const mDp = mongoRoom['Room dp'] || mongoRoom.roomDp || mongoRoom.image;
        if (mName && mName !== 'My Room' && mName !== 'My room' && mName !== 'User') defaultRoomName = mName;
        if (mDp && mDp !== 'undefined' && mDp !== 'null') defaultRoomDp = mDp;
      }
    } catch (err) {
      console.warn('Error fetching room from MongoDB in create room check:', err);
    }

    const createdRoomCard: UserCard = {
      id: storedAccNum,
      accountId: storedAccNum,
      name: defaultRoomName,
      country: localStorage.getItem('userCountry') || '🇮🇳',
      image: defaultRoomDp
    }

    localStorage.setItem('isRoomCreated', 'true')
    localStorage.setItem('myRoom', JSON.stringify(createdRoomCard))
    setIsRoomCreated(true)
    setMyRoom(createdRoomCard)

    await saveRoomToDB({
      ...createdRoomCard,
      isExplicitlyCreated: true,
      createdAt: Date.now()
    });

    const roomData = {
      id: storedAccNum,
      name: defaultRoomName,
      country: localStorage.getItem("userCountry") || "🇮🇳",
      countryCode: localStorage.getItem("userCountryCode") || "IN",
      image: userPhoto || '/default-avatar.png',
      accountId: storedAccNum,
      createdAt: Date.now(),
      isLocked: false,
      roomPassword: null,
      isExplicitlyCreated: true,
      createdFromMineTab: true
    };

    try {
      await saveRoomToMongoDB({
        roomId: storedAccNum,
        id: storedAccNum,
        accountId: storedAccNum,
        roomName: userName || defaultRoomName,
        roomDp: userPhoto || localStorage.getItem('userPhoto') || '/default-avatar.png',
        country: localStorage.getItem("userCountry") || "🇮🇳",
        roomAdmin: storedAccNum,
        message: `${userName || defaultRoomName}'s Room Notice`,
        theme: 'default'
      });

      await saveUserToMongoDB({
        id: currentAccountId,
        appLongId: userUID,
        name: userName || defaultRoomName,
        country: localStorage.getItem("userCountry") || "🇮🇳",
        image: userPhoto || localStorage.getItem('userPhoto') || '/default-avatar.png',
        accountId: storedAccNum
      });
    } catch (e) {
      console.warn('Error saving room/user to Google Sheets:', e);
    }

    setGlobalRooms(prev => {
      const filtered = prev.filter(r => r.accountId !== storedAccNum);
      const updated = [...filtered, roomData as unknown as GlobalRoom];
      saveGlobalRoomsToDB(updated);
      return updated;
    });

    addToRecent({ 
      name: createdRoomCard.name, 
      image: createdRoomCard.image, 
      accountId: storedAccNum 
    })
    setSelectedUser(createdRoomCard)
    setCurrentPage('room')
  }

  const handleUserCardClick = async (user: UserCard) => {
    const rawAccNum =
      localStorage.getItem('accountNumber') ||
      getOrCreateAccountNumber(userUID)

    const currentAccountId =
      typeof rawAccNum === 'string'
        ? rawAccNum
        : (rawAccNum as any).fullAccNum

    const isOwner =
      (user.id && String(user.id) === String(userUID)) ||
      (user.accountId && String(user.accountId) === String(currentAccountId)) ||
      (myRoom && (user.id === myRoom.id || user.accountId === myRoom.accountId));

    if (isOwner) {
      let ownerName = myRoom?.name || user.name;
      if (!ownerName || ownerName === 'My Room' || ownerName === 'My room') {
        ownerName = userName ? `${userName}'s Room` : 'Voice Chat Room';
      }
      let ownerDp = myRoom?.image || user.image;
      if (!ownerDp || ownerDp === 'undefined' || ownerDp === 'null' || ownerDp === '/default-avatar.png') {
        ownerDp = userPhoto || localStorage.getItem('userPhoto') || '/default-avatar.png';
      }

      const ownerRoomUser: UserCard = {
        id: currentAccountId,
        accountId: currentAccountId,
        name: ownerName,
        image: ownerDp,
        country: localStorage.getItem('userCountry') || '🇮🇳'
      };

      setEnteredFromKept(false);
      addToRecent({
        name: ownerRoomUser.name,
        image: ownerRoomUser.image,
        accountId: ownerRoomUser.accountId || ownerRoomUser.id,
      });
      setSelectedUser(ownerRoomUser);
      setCurrentPage('room');
      if (isSearchOpen) setIsSearchOpen(false);
      return;
    }

    const searchAccId = String(user.accountId || user.id || '');
    const foundRoom = globalRooms.find(
      (r) =>
        String(r.accountId || '') === searchAccId ||
        String(r.id || '') === searchAccId
    )

    const canonicalRoomId = String(
      foundRoom?.accountId ||
      user.accountId ||
      foundRoom?.id ||
      user.id ||
      ''
    )

    if (!canonicalRoomId) {
      console.error('Room ID missing')
      return
    }

    const roomUser: UserCard = {
      ...user,
      id: canonicalRoomId,
      accountId: canonicalRoomId,
      name:
        foundRoom?.name && foundRoom.name !== 'My Room' && foundRoom.name !== 'My room'
          ? foundRoom.name
          : user.name && user.name !== 'My Room' && user.name !== 'My room'
          ? user.name
          : 'Voice Chat Room',
      image:
        foundRoom?.image ||
        user.image ||
        '/default-avatar.png',
      isLocked:
        foundRoom?.isLocked ??
        user.isLocked,
    }

    const hasLocalLock = Boolean(roomUser.isLocked) && String(foundRoom?.accountId || foundRoom?.id || '') !== String(currentAccountId);
    if (hasLocalLock) {
      setSelectedLockedRoom(roomUser)
      setShowRoomPasswordCard(true)
      setEnteredRoomPassword('')
      return
    }

    setEnteredFromKept(false)
    addToRecent({
      name: roomUser.name,
      image: roomUser.image,
      accountId:
        roomUser.accountId ||
        roomUser.id,
      isLocked: roomUser.isLocked
    })

    setSelectedUser(roomUser)
    setCurrentPage('room')

    if (isSearchOpen) {
      setIsSearchOpen(false)
    }

    // Background refresh: do not block navigation while loading room details.
    void (async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Room fetch timeout')), 1200)
        );

        const roomData: any = await Promise.race([
          fetchRoomFromMongoDB(canonicalRoomId),
          timeoutPromise,
        ]);

        if (!roomData) return;

        if (
          roomData.isLocked &&
          String(
            roomData['Room Admin'] ||
            roomData.accountId ||
            ''
          ) !== String(currentAccountId)
        ) {
          return;
        }

        const nextRoomUser = { ...roomUser };

        if (roomData['Room Name'] || roomData.roomName || roomData.name) {
          const rName = roomData['Room Name'] || roomData.roomName || roomData.name;
          if (rName !== 'My Room' && rName !== 'My room') {
            nextRoomUser.name = rName;
          }
        }

        if (roomData['Room dp'] || roomData.roomDp || roomData.image) {
          const rDp = roomData['Room dp'] || roomData.roomDp || roomData.image;
          if (rDp !== 'undefined' && rDp !== 'null') {
            nextRoomUser.image = rDp;
          }
        }

        nextRoomUser.isLocked = Boolean(roomData.isLocked)
        setSelectedUser(nextRoomUser)
      } catch (e) {
        console.warn('Failed to fetch room data or timed out:', e)
      }
    })();
  };
