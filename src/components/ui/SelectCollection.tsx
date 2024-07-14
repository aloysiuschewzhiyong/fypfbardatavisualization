// src/components/ui/SelectCollection.tsx

"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";
import { getTopLevelCollections } from "@/app/firebase";

type Props = {};

const SelectCollection: React.FC<Props> = ({}) => {
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsList = await getTopLevelCollections();
        setCollections(collectionsList);
        console.log(collectionsList)
      } catch (error) {
        console.error("Error fetching collections list:", error);
      }
    };

    fetchCollections();
  }, []);

  return (
    <Select>
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
  );
};

export default SelectCollection;
