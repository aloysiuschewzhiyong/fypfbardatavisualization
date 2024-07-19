"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import React, { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth" // Ensure you have initialized Firebase Auth
import { handleUsernameChange } from '@/app/firebase'; // Adjust the import path as needed
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

// Define the validation schema using zod
const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: "Please enter a valid URL." }),
      })
    )
    .optional(),
})

// Define the form values type
type ProfileFormValues = z.infer<typeof profileFormSchema>


export function UsernameForm() {
  const [userId, setUserId] = useState<string | null>(null)
  const auth = getAuth()

  // Check authentication state and set user ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setUserId(null)
      }
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [auth])

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  })

  // Form submission handler
  async function onSubmit(data: ProfileFormValues) {
    if (!userId) {
      toast({
        title: "Error",
        description: "User is not authenticated.",
        variant: "destructive",
      })
      return
    }

    try {
      // Call the function to update the username in Firestore
      await handleUsernameChange(userId, data.username)
      toast({
        title: "Profile Updated",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating the username.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Change Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} autoComplete="new-username" />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  )
}
