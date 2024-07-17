"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "@/components/ui/PageTitle";
import Card, { CardContent } from "@/components/ui/CardBruh";
import {
  getUserData,
  checkAuthState,
  getProfilePictureURL,
  handleSignOut,
} from "@/app/firebase"; // Adjust the import path as needed
import { User } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/ui/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/disply-mode-toggler";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = {};

export default function SettingsPage({}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [avatarURL, setAvatarURL] = useState<string | null>(null);

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
            
            {/* <ProfileForm  /> */}
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
              <RadioGroup defaultValue="option-one" className="flex flex-row space-x-4">
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
