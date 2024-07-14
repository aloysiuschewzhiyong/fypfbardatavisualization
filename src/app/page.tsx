"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Users, CreditCard, Ticket } from "lucide-react";
import Card, { CardContent, CardProps } from "@/components/ui/CardBruh";
import {
  getTotalNotificationReceiversRealtime,
  getActiveCampaignCounts,
  getAuditInfoRealtime,
  getCouponUserCountsRedeemed,
  AuditData,
} from "@/app/firebase"; // Adjust the import path as needed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardGraph from "@/components/ui/DashboardGraph";
import { OrgChart } from "@/components/ui/OrgChart";
import CouponChart from "@/components/ui/CouponChart";
import CampaignChart from "@/components/ui/CampaignGraph";
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

  useEffect(() => {
    getTotalNotificationReceiversRealtime(
      (totalCurrent, totalLast, percentageDiff) => {
        setTotalReceiversCurrentMonth(totalCurrent);
        setTotalReceiversLastMonth(totalLast);
        setPercentageDifference(percentageDiff);
      }
    );

    const fetchActiveCampaignCounts = async () => {
      try {
        const campaignCounts = await getActiveCampaignCounts();
        const now = new Date();
        const currentMonthName = now.toLocaleString('default', { month: 'short' });
        const lastMonthName = new Date(now.setMonth(now.getMonth() - 1)).toLocaleString('default', { month: 'short' });

        const currentMonthCampaign = campaignCounts.find(
          (campaign) => campaign.month === currentMonthName
        );
        const lastMonthCampaign = campaignCounts.find(
          (campaign) => campaign.month === lastMonthName
        );

        const currentCampaigns = currentMonthCampaign ? currentMonthCampaign.campaigns : 0;
        const lastCampaigns = lastMonthCampaign ? lastMonthCampaign.campaigns : 0;
        const percentageDiff = lastCampaigns ? ((currentCampaigns - lastCampaigns) / lastCampaigns * 100) : 0;

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
        const couponCounts = await getCouponUserCountsRedeemed();
        const totalRedeemed = Object.values(couponCounts).reduce((acc, count) => acc + count, 0);
    
        // Assuming you have the counts for last month to calculate percentage difference
        // For demonstration, let's assume last month's redeemed coupons count was 0
        const lastMonthRedeemed = 0; // This should be dynamically fetched or passed
    
        let percentageDiff;
        if (lastMonthRedeemed === 0) {
          percentageDiff = totalRedeemed > 0 ? 100 : 0; // If last month was zero and this month is greater than zero, show 100% increase
        } else {
          percentageDiff = ((totalRedeemed - lastMonthRedeemed) / lastMonthRedeemed) * 100;
        }
    
        setRedeemedCoupons(totalRedeemed);
        setRedeemedCouponsPercentageDifference(percentageDiff);
      } catch (error) {
        console.error("Error fetching redeemed coupons:", error);
      }
    };
    

    fetchActiveCampaignCounts();
    listenToAuditData();
    fetchRedeemedCoupons();
  }, []);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const cardData: CardProps[] = [
    {
      label: `Coupons Issued in ${currentMonthName}`,
      amount: totalReceiversCurrentMonth !== null ? totalReceiversCurrentMonth.toString() : "Loading...",
      description: percentageDifference !== null ? (
        <>
          <span className={percentageDifference >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {percentageDifference.toFixed(1)}%
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
            {redeemedCouponsPercentageDifference.toFixed(1)}%
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
            {activeCampaignsPercentageDifference.toFixed(1)}%
          </span>{" "}
          from last month
        </>
      ) : (
        "Loading..."
      ),
      icon: CreditCard,
    },
    {
      label: "Active Users Now",
      amount: "+573",
      description: "+201 since last hour",
      icon: Users,
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
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
              Some overview content here
            </p>
          </section>

          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="flex items-center justify-center flex-wrap h-auto space-y-1">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="issue">Issue</TabsTrigger>
              <TabsTrigger value="redemption">Redemption</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
              <TabsTrigger value="organization">Organization</TabsTrigger>
            </TabsList>
            <TabsContent value="redemption"></TabsContent>
            <TabsContent value="issue">Issue data here.</TabsContent>
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
