"use client";

import React, { useEffect, useState } from 'react';
import PageTitle from '@/components/ui/PageTitle';
import Card, { CardContent } from '@/components/ui/CardBruh';
import { getUserData, checkAuthState, getProfilePictureURL, getAuditInfoRealtime, AuditData } from '@/app/firebase'; // Adjust the import path as needed
import { User } from 'firebase/auth';
import { AuditProps } from '@/components/ui/ActivityCard';
import ActivityCard from '@/components/ui/ActivityCard';
import { Timestamp } from 'firebase/firestore'; // Import the Timestamp type
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination'; // Import the pagination components

type Props = {}

export default function AuditPage({}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

    const listenToAuditData = () => {
      getAuditInfoRealtime((audits: AuditData[]) => {
        console.log(audits);
        const mappedAudits: AuditProps[] = audits.map(audit => {
          let timestamp: Timestamp;
          if (audit.time instanceof Date) {
            timestamp = Timestamp.fromDate(audit.time);
          } else {
            timestamp = audit.time; // Assuming audit.time is already a Timestamp
          }
          return {
            uid: audit.user,
            action: audit.action,
            object: audit.object,
            timestamp: timestamp
          };
        });
        setAuditData(mappedAudits);
      });
    };

    listenToAuditData();
  }, []);

  // Calculate the current items to display based on pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAuditData = auditData.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(auditData.length / itemsPerPage);

  // Generate pagination items
  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <PaginationItem key={i}>
        <PaginationLink
          isActive={currentPage === i}
          onClick={() => paginate(i)}
        >
          {i}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <PageTitle title="Audit Log" />
      <section className="grid w-full h-full grid-cols-1 gap-4 gap-x-4 transition-all">
        <CardContent className='gap-4 p-6 sm:p-6 md:p-8 lg:p-8 xl:p-10'>
          <div className="space-y-6">
            {currentAuditData.map((d, i) => (
              <ActivityCard
                key={i}
                uid={d.uid}
                action={d.action}
                object={d.object}
                timestamp={d.timestamp}
              />
            ))}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                className={currentPage === 1 ? 'invisible' : ''}
              />
              {paginationItems}
              <PaginationNext
                onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                className={currentPage === totalPages ? 'invisible' : ''}
              />
            </PaginationContent>
          </Pagination>
        </CardContent>
      </section>
    </div>
  );
}
