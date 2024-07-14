import React, { useEffect, useState } from 'react';
import { getProfilePictureURL, getUserData, getCampaignDetailsRealtime } from '@/app/firebase';
import { Timestamp } from 'firebase/firestore'; // Import the Timestamp type
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type AuditProps = {
  uid: string;
  action: string;
  object: string;
  timestamp?: Timestamp; // Add timestamp prop if you want to pass the date and time
};

const ActivityCard: React.FC<AuditProps> = (props) => {
  const [profilePictureURL, setProfilePictureURL] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username: string | null, email: string | null }>({ username: null, email: null });
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }

    const fetchProfilePicture = async () => {
      try {
        const url = await getProfilePictureURL(props.uid);
        setProfilePictureURL(url);
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const data = await getUserData(props.uid);
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const listenToCampaignDetails = () => {
      if (['create campaign', 'edit campaign', 'delete campaign'].includes(props.action)) {
        getCampaignDetailsRealtime(props.object, (campaignDetails) => {
          setCampaignName(campaignDetails.campaignName);
        });
      }
    };

    fetchProfilePicture();
    fetchUserData();
    listenToCampaignDetails();
  }, [props.uid, props.action, props.object]);

  const getActionDescription = () => {
    switch (props.action) {
      case 'create campaign':
        return `Created a campaign: ${campaignName || props.object}`;
      case 'edit campaign':
        return `Updated a campaign: ${campaignName || props.object}`;
      case 'delete campaign':
        return `Deleted a campaign: ${campaignName || props.object}`;
      // Add more cases as needed
      default:
        return `${props.action} ${campaignName || props.object}`;
    }
  };

  const renderDateTime = () => {
    if (!isClient || !props.timestamp) {
      return null;
    }
    return (
      <p className='text-gray-400 text-sm'>
        {new Date(props.timestamp.seconds * 1000).toLocaleString()}
      </p>
    );
  };

  return (
    <div className="px-4 flex flex-wrap justify-between gap-3 items-center border-b pb-4">
      <section className="flex justify-between gap-3 items-center">
        <div className="h-12 w-12 rounded-full bg-gray-100 p-1">
          {profilePictureURL ? (
      //    <Avatar>
      //    <AvatarImage
      //      src={
      //        profilePictureURL ||
      //        "https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg"
      //      }
      //    />
      //    <AvatarFallback>CN</AvatarFallback>
      //  </Avatar>
            <img loading="lazy" width={350} height={350} src={profilePictureURL} alt="avatar" className="rounded-full" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
          )}
        </div>
        <div className="text-sm">
          <p className='font-medium'>{userData.username ? userData.username : props.uid}</p>
          <div className="text-ellipsis overflow-hidden whitespace-nowrap w-[120px] sm:w-auto text-gray-400">
            {userData.email ? userData.email : 'No Email'}
          </div>
        </div>
      </section>
      <div className='flex flex-col items-end'>
        <p className='font-medium text-sm sm:text-sm md:text-md lg:text-md xl:text-md'> 
          {getActionDescription()}
        </p>
        {renderDateTime()}
      </div>
    </div>
  );
};

export default ActivityCard;
