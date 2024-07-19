"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "@/components/ui/PageTitle";
import Card, { CardContent } from "@/components/ui/CardBruh";
import {
  getUserData,
  checkAuthState,
  getProfilePictureURL,
  handleSignOut,
  handleUsernameChange,
  handleEmailChange,
  handlePasswordChange,
  sendEmailVerification,
} from "@/app/firebase"; // Adjust the import path as needed
import { User } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/ui/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/disply-mode-toggler";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner"; // Import Sonner's toast
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

enum EditState {
  None,
  Username,
  Email,
  Password,
}

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
});

const emailFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  currentPassword: z.string().min(8, {
    message: "Current password must be at least 8 characters.",
  }), // Add this field
});

const passwordFormSchema = z.object({
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type EmailFormValues = z.infer<typeof emailFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [editState, setEditState] = useState(EditState.None);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isAwaitingEmailConfirmation, setIsAwaitingEmailConfirmation] = useState(false);

  useEffect(() => {
    checkAuthState(async (user) => {
      setUser(user);
      if (user) {
        const data = await getUserData(user.uid);
        setUserData(data);
        const avatar = await getProfilePictureURL(user.uid);
        setAvatarURL(avatar);
      }
    });
  }, []);

  const handleEditUsername = () => {
    setEditState(EditState.Username);
  };

  const handleEditEmail = () => {
    setEditState(EditState.Email);
  };

  const handleEditPassword = () => {
    setEditState(EditState.Password);
  };

  const handleCancel = () => {
    setEditState(EditState.None);
  };

  const usernameForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    mode: "onChange",
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
  });

  async function handleUsernameUpdate() {
    if (!user || !pendingUsername) {
      toast.error("User is not authenticated or no username provided.");
      return;
    }

    try {
      await handleUsernameChange(user.uid, pendingUsername);
      toast.success("Username updated successfully.");
      // Fetch updated user data
      const updatedUserData = await getUserData(user.uid);
      setUserData(updatedUserData);
      setEditState(EditState.None); // Reset the edit state
      setPendingUsername(null);
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      toast.error("There was an error updating the username.");
    }
  }

  async function handleEmailUpdate() {
    if (!user || !pendingEmail || !currentPassword) {
      toast.error("User is not authenticated or no email provided.");
      return;
    }
  
    try {
      await handleEmailChange(user, pendingEmail, currentPassword);
      await sendEmailVerification(user);
      setIsVerificationSent(true);
      setIsAwaitingEmailConfirmation(true);
      console.log("Email verification sent.");
      toast.success("Email updated successfully. Please check your email to verify the new address.");
    } catch (error) {
      toast.error("There was an error updating the email.");
    }
  }

  async function checkEmailVerification() {
    if (!user) {
      toast.error("User is not authenticated.");
      return;
    }

    try {
      await user.reload();
      if (user.emailVerified) {
        // Fetch updated user data
        const updatedUserData = await getUserData(user.uid);
        setUserData(updatedUserData);
        setEditState(EditState.None); // Reset the edit state
        setPendingEmail(null);
        setIsDialogOpen(false); // Close the dialog
        setIsAwaitingEmailConfirmation(false);
        toast.success("Email verified and updated successfully.");
      } else {
        toast.error("Email has not been verified yet.");
      }
    } catch (error) {
      toast.error("There was an error checking email verification.");
    }
  }

  async function handlePasswordUpdate() {
    if (!user || !pendingPassword || !currentPassword) {
      toast.error("User is not authenticated or no password provided.");
      return;
    }

    try {
      await handlePasswordChange(user, currentPassword, pendingPassword);
      toast.success("Password updated successfully.");
      setEditState(EditState.None); // Reset the edit state
      setPendingPassword(null);
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      toast.error("There was an error updating the password.");
    }
  }

  const handleUsernameFormSubmit = (data: ProfileFormValues) => {
    setPendingUsername(data.username);
    setIsDialogOpen(true);
  };

  const handleEmailFormSubmit = (data: EmailFormValues) => {
    setPendingEmail(data.email);
    setCurrentPassword(data.currentPassword); // Add this line
    setIsDialogOpen(true);
  };

  const handlePasswordFormSubmit = (data: PasswordFormValues) => {
    setPendingPassword(data.newPassword);
    setCurrentPassword(data.currentPassword);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <PageTitle title="Settings" />
      <section className="grid w-full h-full grid-cols-1 gap-4 gap-x-4 transition-all sm:grid-cols-2 xl:grid-cols-2">
        <CardContent className="gap-4 p-6 sm:p-6 md:p-8 lg:p-8 xl:p-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">Account settings</h3>
              <p className="text-sm text-muted-foreground my-2">
                Manage your personal information and update your profile
                settings here.
              </p>
            </div>
            <Separator />
            <div className="flex flex-row items-center">
              <Avatar>
                <AvatarImage
                  src={
                    avatarURL ||
                    "https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              {userData ? (
                <div className="px-4 sm:px-4 md:px-4 lg:px-6 xl:px-10">
                  <p className="sm:text-md md:text-md lg:text-lg xl:text-lg font-semibold">
                    {userData.username}
                  </p>
                  <p className="text-gray-500">{userData.email}</p>
                </div>
              ) : (
                <div className="px-10">
                  <p>Loading user data...</p>
                </div>
              )}
            </div>

            <div className="my-6">
              {editState === EditState.Username ? (
                <Form {...usernameForm}>
                  <form
                    onSubmit={usernameForm.handleSubmit(handleUsernameFormSubmit)}
                    className="space-y-8"
                    autoComplete="off"
                  >
                    <FormField
                      control={usernameForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Change Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="username"
                              {...field}
                              autoComplete="new-username"
                            />
                          </FormControl>
                          <FormDescription>
                            This is your public display name. It can be your real name or a pseudonym.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-4">
                      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button type="submit">Update Username</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Change?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will change your username.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleUsernameUpdate}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : editState === EditState.Email ? (
<Form {...emailForm}>
  <form
    onSubmit={emailForm.handleSubmit(handleEmailFormSubmit)}
    className="space-y-8"
    autoComplete="off"
  >
    <FormField
      control={emailForm.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Change Email</FormLabel>
          <FormControl>
            <Input
              placeholder="email"
              {...field}
              autoComplete="new-email"
            />
          </FormControl>
          <FormDescription>
            This will change your email address.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={emailForm.control}
      name="currentPassword"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Current Password</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="current password"
              {...field}
              autoComplete="current-password"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <div className="flex space-x-4">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button type="submit">Update Email</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Change?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change your email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEmailUpdate}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        type="button"
        variant="secondary"
        onClick={handleCancel}
      >
        Cancel
      </Button>
    </div>
  </form>
</Form>

              ) : editState === EditState.Password ? (
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordFormSubmit)}
                    className="space-y-8"
                    autoComplete="off"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="new password"
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormDescription>
                            This will change your password.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="current password"
                              {...field}
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-4">
                      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button type="submit">Update Password</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Change?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will change your password.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handlePasswordUpdate}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <>
                  {isAwaitingEmailConfirmation ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground my-2">
                        Please check your email to verify the new address. Once verified, click the button below to complete the update.
                      </p>
                      <Button onClick={checkEmailVerification}>
                        Complete Email Update
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <div className="flex flex-row justify-between items-center mt-10">
                          <p className="text-sm md:text-md lg:text-md xl:text-md px-6 ">
                            {userData?.username}
                          </p>
                          <Button variant="ghost" onClick={handleEditUsername}>
                            Edit
                          </Button>
                        </div>
                        <Separator className="h-[0.5px]" />
                      </div>
        
                      <div className="space-y-3">
                        <div className="flex flex-row justify-between items-center mt-4">
                          <p className="text-sm md:text-md lg:text-md xl:text-md px-6 ">
                            {userData?.email}
                          </p>
                          <Button variant="ghost" onClick={handleEditEmail}>
                            Edit
                          </Button>
                        </div>
                        <Separator className="h-[0.5px]" />
                      </div>
        
                      <div className="space-y-3">
                        <div className="flex flex-row justify-between items-center mt-4">
                          <p className="text-sm md:text-md lg:text-md xl:text-md  px-6 ">
                            *************
                          </p>
                          <Button variant="ghost" onClick={handleEditPassword}>
                            Edit
                          </Button>
                        </div>
                        <Separator className="h-[0.5px]" />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardContent className="gap-4 p-6 sm:p-6 md:p-8 lg:p-8 xl:p-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">Accessibility</h3>
              <p className="text-sm text-muted-foreground my-2">
                Adjust your accessibility preferences to suit your needs and
                enhance your experience.
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Toggle display mode</Label>
              <ModeToggle />
            </div>

            <div className="space-y-3 my-2">
              <Label>Enable audit alerts</Label>
              <RadioGroup
                defaultValue="option-one"
                className="flex flex-row space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-one" id="option-one" />
                  <Label htmlFor="option-one">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-two" id="option-two" />
                  <Label htmlFor="option-two">No</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleSignOut}
              className="transition-colors hover:bg-transparent hover:text-red-700 hover:border hover:border-red-700"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </section>
    </div>
  );
}
