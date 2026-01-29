

## Add Delete Confirmation and Improved Conversation Management

### Overview
Add safety and accessibility improvements to the conversation deletion feature:
1. Confirmation dialog before deleting
2. Always-visible delete button on mobile
3. Bulk delete option for clearing old conversations

---

## Changes Required

### 1. Update ConversationItem.tsx - Better Mobile Visibility

**File:** `src/components/assistant/ConversationItem.tsx`

Make delete button visible on mobile (touch devices can't hover):

```typescript
<Button
  variant="ghost"
  size="icon"
  className="h-6 w-6 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 max-sm:opacity-70 transition-opacity"
  onClick={handleDelete}
>
```

---

### 2. Add Delete Confirmation Dialog to ConversationSidebar.tsx

**File:** `src/components/assistant/ConversationSidebar.tsx`

Add state and AlertDialog for confirmation:

```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
         AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
         AlertDialogTitle } from '@/components/ui/alert-dialog';

// Add state
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
const [showClearAllDialog, setShowClearAllDialog] = useState(false);

// Confirmation handler
const confirmDelete = () => {
  if (deleteTarget) {
    deleteConversation.mutate(deleteTarget);
    setDeleteTarget(null);
  }
};
```

Pass `setDeleteTarget` instead of direct delete to ConversationItem.

---

### 3. Add "Clear All" Button to Sidebar Header

**File:** `src/components/assistant/ConversationSidebar.tsx`

Add a dropdown menu with "Clear all conversations" option:

```typescript
<div className="p-4 space-y-2">
  <NewConversationButton onClick={onNewConversation} disabled={isCreating} />
  
  {conversations && conversations.length > 0 && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <MoreHorizontal className="h-4 w-4 mr-2" />
          Manage conversations
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setShowClearAllDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear all conversations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
</div>
```

---

### 4. Add useClearAllConversations Hook

**File:** `src/hooks/useConversations.ts`

Add bulk delete mutation:

```typescript
export function useClearAllConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

---

### 5. Add Confirmation Dialogs JSX

**File:** `src/components/assistant/ConversationSidebar.tsx`

Add dialogs at the end of the component:

```tsx
{/* Single delete confirmation */}
<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this conversation and all its messages.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* Clear all confirmation */}
<AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete all your conversations. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
        Clear All
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/assistant/ConversationItem.tsx` | Make delete button visible on mobile |
| `src/components/assistant/ConversationSidebar.tsx` | Add confirmation dialogs, clear all option |
| `src/hooks/useConversations.ts` | Add `useClearAllConversations` hook |

---

## User Experience

1. **Single Delete**: Click trash icon -> Confirmation dialog -> Confirm or Cancel
2. **Mobile**: Delete button always visible (no hover needed)
3. **Clear All**: "Manage conversations" dropdown -> "Clear all" -> Confirmation dialog

