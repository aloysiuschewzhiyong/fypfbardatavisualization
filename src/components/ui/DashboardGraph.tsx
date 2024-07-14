"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageTitle from "@/components/ui/PageTitle";
import Card, { CardContent } from "@/components/ui/CardBruh";
import {
  getUserData,
  checkAuthState,
  getProfilePictureURL,
  getTopLevelCollections,
  getCountOfDocumentsByField,
} from "@/app/firebase"; // Adjust the import path as needed
import { User } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useCurrentPng } from "recharts-to-png";
import FileSaver from "file-saver";

type Props = {};

// Define the type for collection options
interface CollectionOptions {
  dimensions: string[];
  metrics: string[];
}

// Explicitly define the collection options object
const collectionOptions: { [key: string]: CollectionOptions } = {
  Campaigns: {
    dimensions: ["vendorID", "orgID", "campaignName", "validFrom", "validTo"],
    metrics: ["Count of campaigns", "Average duration of campaigns"],
  },
  Coupons: {
    dimensions: ["couponName", "campaignID", "validFrom", "validTo"],
    metrics: ["Count of coupons"],
  },
  Organizations: {
    dimensions: ["organizationName", "abbreviation"],
    metrics: ["Count of organizations"],
  },
  Users: {
    dimensions: ["username", "email", "role", "organization", "createdAt"],
    metrics: ["Count of users"],
  },
  Vendors: {
    dimensions: ["vendorName", "locationType", "postalCode"],
    metrics: ["Count of vendors"],
  },
};

// Mapping of user-friendly collection names to actual Firestore collection names
const collectionNameMapping: { [key: string]: string } = {
  Campaigns: "campaign",
  Coupons: "couponFRFR",
  Organizations: "organizations",
  Users: "users",
  Vendors: "vendors",
};

// Utility function to generate a random color
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function DataPage({}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(
    null
  );
  const [metrics, setMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("bar"); // State to manage the selected tab
  const [colors, setColors] = useState<string[]>([]);

  const [getBarPng, { ref: barChartRef }] = useCurrentPng();
  const [getPiePng, { ref: pieChartRef }] = useCurrentPng();

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

    const fetchCollections = async () => {
      try {
        const collectionsList = await getTopLevelCollections();
        setCollections(collectionsList);
        console.log("Collections List:", collectionsList);
      } catch (error) {
        console.error("Error fetching collections list:", error);
      }
    };

    fetchCollections();
  }, []);

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (selectedCollection) {
        try {
          const actualCollectionName =
            collectionNameMapping[selectedCollection];
          const data = await getCountOfDocumentsByField(
            actualCollectionName,
            "vendorID",
            "Count of campaigns"
          );
          setCollectionData(
            Object.entries(data).map(([key, value]) => ({ name: key, value }))
          );
          console.log(`Data for ${selectedCollection}:`, data);

          // Type assertion to ensure selectedCollection is a key of collectionOptions
          const selectedOptions = collectionOptions[
            selectedCollection as keyof typeof collectionOptions
          ] || {
            dimensions: [],
            metrics: [],
          };

          setDimensions(selectedOptions.dimensions);
          setMetrics(selectedOptions.metrics);
          setColors(Object.keys(data).map(() => getRandomColor()));
        } catch (error) {
          console.error(
            `Error fetching data for collection ${selectedCollection}:`,
            error
          );
        }
      }
    };

    fetchCollectionData();
  }, [selectedCollection]);

  useEffect(() => {
    const fetchDimensionData = async () => {
      if (selectedCollection && selectedDimension) {
        try {
          const actualCollectionName =
            collectionNameMapping[selectedCollection];
          const data = await getCountOfDocumentsByField(
            actualCollectionName,
            selectedDimension,
            "Count of campaigns"
          );
          setCollectionData(
            Object.entries(data).map(([key, value]) => ({ name: key, value }))
          );
          console.log(
            `Data for ${selectedCollection} with dimension ${selectedDimension}:`,
            data
          );
          setColors(Object.keys(data).map(() => getRandomColor()));
        } catch (error) {
          console.error(
            `Error fetching data for collection ${selectedCollection} with dimension ${selectedDimension}:`,
            error
          );
        }
      }
    };

    fetchDimensionData();
  }, [selectedCollection, selectedDimension]);

  useEffect(() => {
    const fetchMetricData = async () => {
      if (selectedCollection && selectedDimension && selectedMetric) {
        try {
          const actualCollectionName =
            collectionNameMapping[selectedCollection];
          const data = await getCountOfDocumentsByField(
            actualCollectionName,
            selectedDimension,
            selectedMetric
          );
          setCollectionData(
            Object.entries(data).map(([key, value]) => ({ name: key, value }))
          );
          console.log(
            `Data for ${selectedCollection} with dimension ${selectedDimension} and metric ${selectedMetric}:`,
            data
          );
          setColors(Object.keys(data).map(() => getRandomColor()));
        } catch (error) {
          console.error(
            `Error fetching data for collection ${selectedCollection} with dimension ${selectedDimension} and metric ${selectedMetric}:`,
            error
          );
        }
      }
    };

    fetchMetricData();
  }, [selectedCollection, selectedDimension, selectedMetric]);

  const getYAxisLabel = () => {
    if (selectedMetric === "Count of campaigns") {
      return "Number of Campaigns";
    } else if (selectedMetric === "Average duration of campaigns") {
      return "Average Duration (days)";
    } else if (selectedMetric === "Count of coupons") {
      return "Number of Coupons";
    } else if (selectedMetric === "Count of organizations") {
      return "Number of Users";
    } else if (selectedMetric === "Count of users") {
      return "Number of Users";
    } else if (selectedMetric === "Count of vendors") {
      return "Number of Vendors";
    } else {
      return "Value";
    }
  };

  const getLegendName = () => {
    if (selectedMetric === "Count of campaigns") {
      return "No. of Campaigns";
    } else if (selectedMetric === "Average duration of campaigns") {
      return "Average Duration (days)";
    } else if (selectedMetric === "Count of coupons") {
      return "No. of Coupons";
    } else if (selectedMetric === "Count of organizations") {
      return "No. of Users";
    } else if (selectedMetric === "Count of users") {
      return "No. of Users";
    } else if (selectedMetric === "Count of vendors") {
      return "No. of Vendors";
    } else {
      return "Value";
    }
  };

  const handleDownload = async () => {
    console.log("Download button clicked");
    let png;
    try {
      if (selectedTab === "bar") {
        console.log("Generating PNG for bar chart");
        png = await getBarPng();
        console.log("Generated bar chart PNG:", png);
      } else if (selectedTab === "pie") {
        console.log("Generating PNG for pie chart");
        png = await getPiePng();
        console.log("Generated pie chart PNG:", png);
      }

      if (png) {
        console.log("PNG generated, starting download");
        FileSaver.saveAs(png, `${selectedCollection}-${selectedMetric}-chart.png`);
        console.log("Download initiated");
      } else {
        console.log("Failed to generate PNG");
      }
    } catch (error) {
      console.error("Error during PNG generation or download:", error);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <PageTitle title="Graph Builder" />
      <section className="grid w-full h-full grid-cols-1 gap-4 transition-all sm:grid-cols-1  sm:grid-cols-5 xl:grid-cols-5">
        <CardContent className="col-span-1 gap-4 p-6 sm:p-6 md:p-8 lg:p-8 xl:p-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">Query</h3>
              <p className="text-sm text-muted-foreground my-2">
                Select and filter your data.
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Select collection</Label>
              <Select
                onValueChange={(value) => {
                  setSelectedCollection(value);
                  setSelectedDimension(null); // Reset dimension when collection changes
                  setSelectedMetric(null); // Reset metric when collection changes
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectScrollUpButton />
                  <SelectGroup>
                    {collections.map((collection) => (
                      <SelectItem key={collection} value={collection}>
                        {collection}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectScrollDownButton />
                </SelectContent>
              </Select>
            </div>

            {selectedCollection && (
              <div className="space-y-3">
                <Label>Select dimension</Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedDimension(value);
                    setSelectedMetric(null); // Reset metric when dimension changes
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectScrollUpButton />
                    <SelectGroup>
                      {dimensions.map((dimension) => (
                        <SelectItem key={dimension} value={dimension}>
                          {dimension}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectScrollDownButton />
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedDimension && (
              <div className="space-y-3">
                <Label>Select metric</Label>
                <Select key={selectedDimension} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectScrollUpButton />
                    <SelectGroup>
                      {metrics.map((metric) => (
                        <SelectItem key={metric} value={metric}>
                          {metric}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectScrollDownButton />
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>

        <CardContent className="col-span-4 gap-4 p-6 sm:p-6 md:p-8 lg:p-8 xl:p-10">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex justify-between">
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              </TabsList>

              <Button
                variant={"outline"}
                size={"icon"}
                onClick={handleDownload}
              >
                <Download />
              </Button>
            </div>

            <Separator className="my-6" />
            <TabsContent value="table">
              <div className="space-y-3">
                {selectedCollection &&
                  collectionData.length > 0 &&
                  selectedDimension &&
                  selectedMetric && (
                    <>
                      <h3 className="text-lg font-medium">
                        Data for {selectedCollection}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{selectedDimension}</TableHead>
                            <TableHead>{selectedMetric}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collectionData.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
              </div>
            </TabsContent>
            <TabsContent value="bar">
              <div className="space-y-3">
                {selectedCollection &&
                  collectionData.length > 0 &&
                  selectedDimension &&
                  selectedMetric && (
                    <>
                      <h3 className="text-lg font-medium">
                        Data for {selectedCollection}
                      </h3>
                      <div ref={barChartRef}>
                        <ChartContainer config={{}} className="h-[350px] w-full">
                          <BarChart data={collectionData} accessibilityLayer>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar
                              dataKey="value"
                              fill="currentColor"
                              radius={[6, 6, 0, 0]}
                              name={getLegendName()}
                            />
                            <LabelList dataKey="value" position="top" />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </>
                  )}
              </div>
            </TabsContent>
            <TabsContent value="pie">
              <div className="space-y-3">
                {selectedCollection &&
                  collectionData.length > 0 &&
                  selectedDimension &&
                  selectedMetric && (
                    <>
                      <h3 className="text-lg font-medium">
                        Data for {selectedCollection}
                      </h3>
                      <div ref={pieChartRef}>
                        <ChartContainer config={{}} className="h-[350px] w-full">
                          <PieChart>
                            <Pie
                              data={collectionData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={80}
                              label
                              labelLine={false}
                              name={getLegendName()}
                            >
                              {collectionData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={colors[index % colors.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                          </PieChart>
                        </ChartContainer>
                      </div>
                    </>
                  )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </section>
    </div>
  );
}
