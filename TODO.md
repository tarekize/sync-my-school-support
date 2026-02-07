# TODO: Implement Pedago Role Features

## Tasks
- [x] Fix AuthContext to skip /complete-profile for pedago
- [x] Fix ListeCours.tsx line 373 to include pedago in filiere view
- [x] Add CRUD capabilities for pedago (RLS policies)
- [x] Enable realtime on chapters/lessons
- [x] Add TabsContent for pedagos in Admin.tsx

## Progress
- [x] AuthContext.tsx: Modify onAuthStateChange to skip /complete-profile redirection if the user has 'pedago' role.
- [x] ListeCours.tsx: Update the filiere view condition to include pedagos: change `if (isAdmin && selectedLevel)` to `if ((isAdmin || isPedago) && selectedLevel)`.
- [x] RLS Policies: Create a new migration to add policies for pedago full CRUD access on chapters and lessons.
- [x] Realtime: Add realtime subscriptions in Cours.tsx for chapters and lessons updates.
- [x] Admin.tsx: Add the missing TabsContent for pedagos with user management table.
