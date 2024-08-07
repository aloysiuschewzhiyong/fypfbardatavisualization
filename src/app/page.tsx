"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Users, CreditCard, Ticket } from "lucide-react";
import Card, { CardContent, CardProps } from "@/components/ui/CardBruh";
import {
  getTotalNotificationReceiversRealtime,
  getActiveCampaignCounts,
  getAuditInfoRealtime,
  getActiveUsersInPastTwoHours,
  getMonthlyRedemptionCount, // Import the function
  AuditData,
} from "@/app/firebase"; // Adjust the import path as needed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageTitle from "@/components/ui/PageTitle";
import CouponRedemptionChart from "@/components/ui/CouponRedemptionGraph";
import CouponIssuanceChart from "@/components/ui/CouponIssuanceGraph";
import CampaignChart from "@/components/ui/CampaignGraph";
import CouponChart from "@/components/ui/CouponChart";
import { OrgChart } from "@/components/ui/OrgChart";
import ActivityCard, { AuditProps } from "@/components/ui/ActivityCard";

const HomeContent: React.FC = () => {
  const router = useRouter();
  const [totalReceiversCurrentMonth, setTotalReceiversCurrentMonth] = useState<number | null>(null);
  const [totalReceiversLastMonth, setTotalReceiversLastMonth] = useState<number | null>(null);
  const [percentageDifference, setPercentageDifference] = useState<number | null>(null);
  const [activeCampaignsCurrentMonth, setActiveCampaignsCurrentMonth] = useState<number | null>(null);
  const [activeCampaignsLastMonth, setActiveCampaignsLastMonth] = useState<number | null>(null);
  const [activeCampaignsPercentageDifference, setActiveCampaignsPercentageDifference] = useState<number | null>(null);
  const [auditData, setAuditData] = useState<AuditProps[]>([]);
  const [redeemedCoupons, setRedeemedCoupons] = useState<number | null>(null);
  const [redeemedCouponsPercentageDifference, setRedeemedCouponsPercentageDifference] = useState<number | null>(null);
  const [activeUsersInPastHour, setActiveUsersInPastHour] = useState<number | null>(null);
  const [activeUsersPercentageDifference, setActiveUsersPercentageDifference] = useState<number | null>(null);

  useEffect(() => {
    getTotalNotificationReceiversRealtime(
      (totalCurrent, totalLast, percentageDiff) => {
        setTotalReceiversCurrentMonth(totalCurrent);
        setTotalReceiversLastMonth(totalLast);
        setPercentageDifference(percentageDiff);
        console.log('Total Last:', totalLast); // Log the total receivers data
      }
    );

    const fetchActiveCampaignCounts = async () => {
      try {
        const campaignCounts = await getActiveCampaignCounts();
        const now = new Date();
        const currentMonthName = now.toLocaleString('default', { month: 'short' });
        const lastMonthName = new Date(now.setMonth(now.getMonth() - 1)).toLocaleString('default', { month: 'short' });

        console.log('Campaign Counts:', campaignCounts); // Log the campaign counts data

        const currentMonthCampaign = campaignCounts.find(
          (campaign) => campaign.month === currentMonthName
        );
        const lastMonthCampaign = campaignCounts.find(
          (campaign) => campaign.month === lastMonthName
        );

        const currentCampaigns = currentMonthCampaign ? currentMonthCampaign.campaigns : 0;
        const lastCampaigns = lastMonthCampaign ? lastMonthCampaign.campaigns : 0;
        const percentageDiff = lastCampaigns === 0
          ? currentCampaigns * 100
          : ((currentCampaigns - lastCampaigns) / lastCampaigns * 100);

        console.log('Current Month:', currentMonthName, 'Current Campaigns:', currentCampaigns); // Log current month campaigns
        console.log('Last Month:', lastMonthName, 'Last Campaigns:', lastCampaigns); // Log last month campaigns

        setActiveCampaignsCurrentMonth(currentCampaigns);
        setActiveCampaignsLastMonth(lastCampaigns);
        setActiveCampaignsPercentageDifference(percentageDiff);
      } catch (error) {
        console.error('Error fetching active campaign counts:', error);
      }
    };

    const listenToAuditData = () => {
      getAuditInfoRealtime((audits: AuditData[]) => {
        const filteredAudits = audits.slice(0, 4);
        const mappedAudits: AuditProps[] = filteredAudits.map(audit => ({
          uid: audit.user,
          action: audit.action,
          object: audit.object,
        }));
        setAuditData(mappedAudits);
      });
    };

    const fetchRedeemedCoupons = async () => {
      try {
        const redemptionData = await getMonthlyRedemptionCount();

        const now = new Date();
        const currentMonth = now.getMonth();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const currentYear = now.getFullYear();
        const previousMonthYear = previousMonth === 11 ? currentYear - 1 : currentYear;

        const currentMonthData = redemptionData.find(data => {
          const date = new Date(`${data.month} ${currentYear}`);
          return date.getMonth() === currentMonth;
        });

        const previousMonthData = redemptionData.find(data => {
          const date = new Date(`${data.month} ${previousMonthYear}`);
          return date.getMonth() === previousMonth;
        });

        const currentMonthCount = currentMonthData ? currentMonthData.redemptions : 0;
        const previousMonthCount = previousMonthData ? previousMonthData.redemptions : 0;

        const percentageDiff = previousMonthCount === 0
          ? currentMonthCount * 100
          : ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;

        console.log('Previous Month Redeemed Coupons:', previousMonthCount); // Log previous month count
        console.log('Current Month Redeemed Coupons:', currentMonthCount); // Log current month count
        console.log('Percentage Difference in Redeemed Coupons:', percentageDiff); // Log percentage difference

        setRedeemedCoupons(currentMonthCount);
        setRedeemedCouponsPercentageDifference(percentageDiff);
      } catch (error) {
        console.error("Error fetching redeemed coupons:", error);
      }
    };

    const fetchActiveUsersInPastTwoHours = async () => {
      try {
        const { currentHour, previousHour, percentageDifference } = await getActiveUsersInPastTwoHours();
        setActiveUsersInPastHour(currentHour.length);
        setActiveUsersPercentageDifference(percentageDifference);
      } catch (error) {
        console.error("Error fetching active users in past hour:", error);
      }
    };

    fetchActiveCampaignCounts();
    listenToAuditData();
    fetchRedeemedCoupons();
    fetchActiveUsersInPastTwoHours();
  }, []);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const cardData: CardProps[] = [
    {
      label: `Coupons Issued in ${currentMonthName}`,
      amount: totalReceiversCurrentMonth !== null ? totalReceiversCurrentMonth.toString() : "Loading...",
      description: percentageDifference !== null ? (
        <>
          <span className={percentageDifference >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {formatPercentage(percentageDifference)}
          </span>{" "}
          from last month
        </>
      ) : (
        "Loading..."
      ),
      icon: Ticket,
    },
    {
      label: `Coupons Redeemed in ${currentMonthName}`,
      amount: redeemedCoupons !== null ? redeemedCoupons.toString() : "Loading...",
      description: redeemedCouponsPercentageDifference !== null ? (
        <>
          <span className={redeemedCouponsPercentageDifference >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {formatPercentage(redeemedCouponsPercentageDifference)}
          </span>{" "}
          from last month
        </>
      ) : (
        "Loading..."
      ),
      icon: Ticket,
    },
    {
      label: `Active Campaigns in ${currentMonthName}`,
      amount: activeCampaignsCurrentMonth !== null ? activeCampaignsCurrentMonth.toString() : "Loading...",
      description: activeCampaignsPercentageDifference !== null ? (
        <>
          <span className={activeCampaignsPercentageDifference >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {formatPercentage(activeCampaignsPercentageDifference)}
          </span>{" "}
          from last month
        </>
      ) : (
        "Loading..."
      ),
      icon: CreditCard,
    },
    {
      label: "Active Users In Last Hour",
      amount: activeUsersInPastHour !== null ? activeUsersInPastHour.toString() : "Loading...",
      description: activeUsersPercentageDifference !== null ? (
        <>
          <span className={activeUsersPercentageDifference >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {formatPercentage(activeUsersPercentageDifference)}
          </span>{" "}
          from prev hour
        </>
      ) : (
        "Loading..."
      ),
      icon: Users,
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle title="Dashboard" />
      <section className="grid w-full grid-cols-1 gap-4 gap-x-4 transition-all sm:grid-cols-2 xl:grid-cols-4">
        {cardData.map((d, i) => (
          <Card
            key={i}
            amount={d.amount}
            description={d.description}
            icon={d.icon}
            label={d.label}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
        <CardContent>
          <section>
            <p className="font-semibold">Overview</p>
            <p className="text-sm text-gray-400 mb-0">
              Quick overview of the app metrics
            </p>
          </section>

          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="flex items-center justify-center flex-wrap h-auto">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="issue">Issued</TabsTrigger>
              <TabsTrigger value="redemption">Redemption</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
              <TabsTrigger value="organization">Organization</TabsTrigger>
            </TabsList>
            <TabsContent value="redemption">
              <CouponRedemptionChart />
            </TabsContent>
            <TabsContent value="issue">
              <CouponIssuanceChart />
            </TabsContent>
            <TabsContent value="campaigns">
              <CampaignChart />
            </TabsContent>
            <TabsContent value="coupons">
              <CouponChart />
            </TabsContent>
            <TabsContent value="organization">
              <OrgChart />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardContent className="space-y-1" onClick={() => router.push('/auditLog')}>
          <section>
            <p className="font-semibold">App Activity</p>
            <p className="text-sm text-gray-400 mb-0">Recent app activities</p>
          </section>

          {auditData.map((d, i) => (
            <ActivityCard
              key={i}
              uid={d.uid}
              action={d.action}
              object={d.object}
            />
          ))}
        </CardContent>
      </section>
    </div>
  );
};

export default HomeContent;

const formatPercentage = (percentage: number) => {
  if (percentage === null) return "Loading...";
  if (percentage === 0) return "+0.0%";
  return percentage > 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
};
