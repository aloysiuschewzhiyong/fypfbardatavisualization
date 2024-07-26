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
} from "@/app/firebase";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useGenerateImage } from "recharts-to-png";
import FileSaver from "file-saver";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {};

interface CollectionOptions {
  dimensions: { key: string, label: string }[];
  metrics: string[];
}

interface Item {
  name: string;
  value: number;
}

interface CollectionOptions {
  dimensions: { key: string, label: string }[];
  metrics: string[];
}

const collectionOptions: { [key: string]: CollectionOptions } = {
  Campaigns: {
    dimensions: [
      { key: "vendorID", label: "Vendor" },
      { key: "orgID", label: "Organization" },
      { key: "campaignName", label: "Campaign" }
    ],
    metrics: ["Count of campaigns", "Average duration of campaigns"],
  },
  Coupons: {
    dimensions: [
      { key: "couponName", label: "Coupon" },
      { key: "campaignID", label: "Campaign" }
    ],
    metrics: ["Count of coupons", "Issuance count", "Redemption count"],
  },
  Users: {
    dimensions: [
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "organization", label: "Organization" }
    ],
    metrics: ["Count of users", "Issuance count", "Redemption count"],
  },
  Vendors: {
    dimensions: [
      { key: "vendorName", label: "Vendor" },
      { key: "locationType", label: "Location Type" }
    ],
    metrics: ["Count of vendors", "Issuance count", "Redemption count"],
  },
};


const collectionNameMapping: { [key: string]: string } = {
  Campaigns: "campaign",
  Coupons: "couponFRFR",
  Organizations: "organizations",
  Users: "users",
  Vendors: "vendors",
};

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function DataPage({ }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionData, setCollectionData] = useState<Item[]>([]);
  const [dimensions, setDimensions] = useState<{ key: string, label: string }[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<{ key: string, label: string } | null>(null);
  const [metrics, setMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("bar");
  const [colors, setColors] = useState<string[]>([]);
  const [barFillColor, setBarFillColor] = useState<string>("currentColor");
  const [sortOrder, setSortOrder] = useState<string>("none");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [getBarPng, { ref: barChartRef }] = useGenerateImage<HTMLDivElement>({
    quality: 1,
    type: 'image/png',
  });

  const [getPiePng, { ref: pieChartRef }] = useGenerateImage<HTMLDivElement>({
    quality: 1,
    type: 'image/png',
  });

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
    if (selectedCollection) {
      const selectedOptions = collectionOptions[selectedCollection] || {
        dimensions: [],
        metrics: [],
      };
      setDimensions(selectedOptions.dimensions);
      setMetrics(selectedOptions.metrics);
      setSelectedDimension(null);
      setSelectedMetric(null);
    }
  }, [selectedCollection]);

  const fetchCollectionData = async (collection: string, dimension: { key: string, label: string }, metric: string) => {
    try {
      console.log("Fetching data for:", { collection, dimension, metric });
      const actualCollectionName = collectionNameMapping[collection];
      const data = await getCountOfDocumentsByField(
        actualCollectionName,
        dimension.key,
        metric
      );
      setCollectionData(
        Object.entries(data).map(([key, value]) => ({ name: key, value }))
      );
      console.log(`Data for ${collection} with dimension ${dimension.label} and metric ${metric}:`, data);
      setColors(Object.keys(data).map(() => getRandomColor()));
    } catch (error) {
      console.error(`Error fetching data for collection ${collection} with dimension ${dimension.label} and metric ${metric}:`, error);
    }
  };

  useEffect(() => {
    if (selectedCollection && selectedDimension && selectedMetric) {
      fetchCollectionData(selectedCollection, selectedDimension, selectedMetric);
    }
  }, [selectedCollection, selectedDimension, selectedMetric]);

  const getYAxisLabel = () => {
    if (selectedMetric === "Count of campaigns") {
      return "Number of Campaigns";
    } else if (selectedMetric === "Average duration of campaigns") {
      return "Average Duration (days)";
    } else if (selectedMetric === "Count of coupons") {
      return "Number of Coupons";
    } else if (selectedMetric === "Issuance count") {
      return "Number of Issuances";
    } else if (selectedMetric === "Redemption count") {
      return "Number of Redemptions";
    } else if (selectedMetric === "Count of organizations") {
      return "Number of Users in Organization";
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
    } else if (selectedMetric === "Issuance count") {
      return "No. of Issuances";
    } else if (selectedMetric === "Redemption count") {
      return "No. of Redemptions";
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

  const sortData = useCallback((data: Item[], order: string) => {
    if (order === "ascending") {
      return [...data].sort((a, b) => a.value - b.value);
    } else if (order === "descending") {
      return [...data].sort((a, b) => b.value - a.value);
    }
    return data;
  }, []);

  useEffect(() => {
    setCollectionData((prevData) => sortData(prevData, sortOrder));
  }, [sortOrder, sortData]);

  const handleDownload = async () => {
    console.log("Download button clicked");
    let png;
    try {
      if (selectedTab === "bar") {
        console.log("Generating PNG for bar chart");
        setBarFillColor("black");
        requestAnimationFrame(async () => {
          png = await getBarPng();
          console.log("Generated bar chart PNG:", png);
          setBarFillColor("currentColor");

          if (png) {
            console.log("PNG generated, starting download");
            FileSaver.saveAs(png, `${selectedCollection}-${selectedMetric}-chart.png`);
            console.log("Download initiated");
          } else {
            console.log("Failed to generate PNG");
          }
        });
      } else if (selectedTab === "pie") {
        console.log("Generating PNG for pie chart");
        png = await getPiePng();
        console.log("Generated pie chart PNG:", png);

        if (png) {
          console.log("PNG generated, starting download");
          FileSaver.saveAs(png, `${selectedCollection}-${selectedMetric}-chart.png`);
          console.log("Download initiated");
        } else {
          console.log("Failed to generate PNG");
        }
      }
    } catch (error) {
      console.error("Error during PNG generation or download:", error);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortData(collectionData.slice(indexOfFirstItem, indexOfLastItem), sortOrder);

  const totalPages = Math.ceil(collectionData.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPageNumbers = 3;
    const halfMaxPageNumbers = Math.floor(maxPageNumbers / 2);
    let startPage = Math.max(currentPage - halfMaxPageNumbers, 1);
    let endPage = Math.min(startPage + maxPageNumbers - 1, totalPages);

    if (endPage - startPage < maxPageNumbers - 1) {
      startPage = Math.max(endPage - maxPageNumbers + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationPrevious
            onClick={handlePreviousPage}
            className={currentPage === 1 ? "invisible" : ""}
          >
            Previous
          </PaginationPrevious>
          {pageNumbers.map((number) => (
            <PaginationItem key={number}>
              <PaginationLink
                isActive={currentPage === number}
                onClick={() => handlePageClick(number)}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationNext
            onClick={handleNextPage}
            className={currentPage === totalPages ? "invisible" : ""}
          >
            Next
          </PaginationNext>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <PageTitle title="Graph Builder" />
      <section className="grid w-full h-full grid-cols-1  gap-4 transition-all lg:grid-cols-5 xl:grid-cols-5">
        <CardContent className="col-span-1 lg:col-span-2 xl:col-span-1 gap-4 p-4 sm:p-4 md:p-6 lg:p-8 xl:p-10">
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
                  setSelectedDimension(null);
                  setSelectedMetric(null);
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
                    const dimension = dimensions.find(d => d.key === value);
                    setSelectedDimension(dimension || null);
                    setSelectedMetric(null);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectScrollUpButton />
                    <SelectGroup>
                      {dimensions.map((dimension) => (
                        <SelectItem key={dimension.key} value={dimension.key}>
                          {dimension.label}
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
                <Select key={selectedDimension.key} onValueChange={setSelectedMetric}>
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

            {selectedMetric && (
              <div className="space-y-3">
                <Label>Sort By</Label>
                <Select onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectScrollUpButton />
                    <SelectGroup>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ascending">Ascending</SelectItem>
                      <SelectItem value="descending">Descending</SelectItem>
                    </SelectGroup>
                    <SelectScrollDownButton />
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>

        <CardContent className="col-span-1  md:col-span-1 lg:col-span-3 xl:col-span-4 gap-4 p-6 sm:p-6 md:p-8 lg:p-8 xl:p-10 ">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex justify-between">
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              </TabsList>

              <Button variant={"outline"} size={"icon"} onClick={handleDownload}>
                <Download />
              </Button>
            </div>

            <Separator className="my-6" />
            <TabsContent value="table">
              <div className="space-y-3">
                {selectedCollection &&
                  currentItems.length > 0 &&
                  selectedDimension &&
                  selectedMetric && (
                    <>
                      <h3 className="text-lg font-medium">
                        Data for {selectedCollection}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{selectedDimension.label}</TableHead>
                            <TableHead>{selectedMetric}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((item: Item) => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {collectionData.length > itemsPerPage && renderPagination()}
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
                            <YAxis
                              domain={[0, (dataMax: number) => Math.ceil(dataMax / 5) * 5 + 1]}
                              label={{
                                value: getYAxisLabel(),
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar
                              dataKey="value"
                              fill={barFillColor}
                              radius={[6, 6, 0, 0]}
                              name={getLegendName()}
                            >
                              <LabelList dataKey="value" position="top" />
                            </Bar>
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
