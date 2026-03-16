'use client'

import { CardTitle, CardDescription, CardHeader, Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Key, Trash2 } from 'lucide-react'
import useSWR from 'swr'
import { apiFetcher } from '@/lib/swr'
import { User } from '@/types'
import { Message } from '@/components/ui/message'
import { useState } from 'react'
import { ManageUserDialog } from '@/components/settings/user-dialogs/manage-user'
import { ChangePasswordDialog } from '@/components/settings/user-dialogs/change-password'
import { DeleteUserDialog } from '@/components/settings/user-dialogs/delete-user'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export const UsersTab = ({ currentUser }: { currentUser: User }) => {
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // This is a trick to re-render the form, essentially resetting fields and action
  const [manageUsersKey, setManageUsersKey] = useState<number>(0)
  const [changePasswordKey, setChangePasswordKey] = useState<number>(0)
  const [deleteUserKey, setDeleteUserKey] = useState<number>(0)

  const [message, setMessage] = useState<string>('')

  const handleAddUser = () => {
    setSelectedUser(null)
    setManageUsersKey((v) => v + 1)
    setUserDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setManageUsersKey((v) => v + 1)
    setUserDialogOpen(true)
  }

  const handleChangePassword = (user: User) => {
    setSelectedUser(user)
    setChangePasswordKey((v) => v + 1)
    setPasswordDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteUserKey((v) => v + 1)
    setDeleteDialogOpen(true)
  }

  const { data, error, isLoading, mutate } = useSWR<{ data: User[] }>('/api/users', apiFetcher)

  if (!data || isLoading) {
    return <>Loading...</>
  }

  const users = data?.data || []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Add, edit, or remove users who can access this application</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddUser} className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        {error && <Message message={error} success={false} duration={99} />}
        {message && <Message message={message} success={true} duration={5} />}
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                      {user.id === currentUser?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} title="Edit user">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleChangePassword(user)}
                          title="Change password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete user'}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ManageUserDialog
        open={userDialogOpen}
        onOpenChangeAction={setUserDialogOpen}
        user={selectedUser}
        onSuccessAction={async (message: string) => {
          setMessage(message)
          setSelectedUser(null)
          await mutate()
        }}
        key={`manage_ + ${manageUsersKey}`}
      />
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChangeAction={setPasswordDialogOpen}
        user={selectedUser}
        onSuccessAction={async (message: string) => {
          setMessage(message)
          setSelectedUser(null)
          await mutate()
        }}
        key={`change_${changePasswordKey}`}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChangeAction={setDeleteDialogOpen}
        user={selectedUser}
        onSuccessAction={async (message: string) => {
          setMessage(message)
          setSelectedUser(null)
          await mutate()
        }}
        key={`delete_${deleteUserKey}`}
      />
    </>
  )
}
