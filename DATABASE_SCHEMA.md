# Routin0 Database Schema Structure

## User
```
{
  _id: ObjectId (auto-generated)
  firebaseUid: String (unique, required, indexed)
  email: String
  displayName: String
  photoURL: String
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

## ParentRoutine
```
{
  _id: ObjectId (auto-generated)
  user: ObjectId (ref: 'User', required, indexed)
  title: String (required)
  category: String (default: 'General')
  description: String
  streak: Number (default: 0)
  completion: Number (default: 0)
  history: [
    {
      label: String
      success: Boolean
      _id: false (no embedded ID)
    }
  ]
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

## SubRoutine
```
{
  _id: ObjectId (auto-generated)
  user: ObjectId (ref: 'User', required, indexed)
  parent: ObjectId (ref: 'ParentRoutine', required, indexed)
  title: String (required)
  category: String (default: 'General')
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

## Routine
```
{
  _id: ObjectId (auto-generated)
  user: ObjectId (ref: 'User', required, indexed)
  parent: ObjectId (ref: 'ParentRoutine', required, indexed)
  subRoutine: ObjectId (ref: 'SubRoutine', required, indexed)
  title: String (required)
  description: String
  category: String (default: 'General')
  type: String (enum: ['yes_no', 'quantity', 'slider'], default: 'yes_no')
  inputConfig: {
    target: Number
    unit: String
    min: Number
    max: Number
    _id: false (no embedded ID)
  }
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

## RoutineLog
```
{
  _id: ObjectId (auto-generated)
  user: ObjectId (ref: 'User', required, indexed)
  parent: ObjectId (ref: 'ParentRoutine', required, indexed)
  subRoutine: ObjectId (ref: 'SubRoutine', required, indexed)
  routine: ObjectId (ref: 'Routine', required, indexed)
  action: String (enum: ['not_done', 'skip', 'pass', 'done'], required)
  value: Mixed (optional — for quantity/slider type routines)
  dateKey: String (required, indexed, format: 'YYYY-MM-DD')
  timestamp: Date (default: Date.now, no createdAt/updatedAt)
}
```

---

## Data Relationships (Hierarchy)
```
User (1)
  ├─ ParentRoutine (many)
  │   ├─ SubRoutine (many, child of parent)
  │   │   └─ Routine (many, specific tasks within sub-routine)
  │   │       └─ RoutineLog (many, daily execution records)
```

---

## Key Notes
- **Indexing:** user, parent, subRoutine, routine, dateKey are indexed for fast queries
- **Timestamps:** All models auto-track createdAt & updatedAt except RoutineLog (only explicit timestamp)
- **References:** All cross-model links use ObjectId + ref for Mongoose population
- **Enums:** Routine.type is constrained; RoutineLog.action is constrained to 4 actions
