"use client";

import { Sequences } from "@/types/types";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";

const STEP_BOXES_GAP = 12;
const NUM_OF_STEPS = 16;

export const Sequencer: React.FC<any> = ({
  sequence,
  variation,
  setSequence,
  setSequences,
  slot,
  step,
  isPlaying,
}) => {
  const [parentWidth, setParentWidth] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [isWriting, setWriteState] = useState<boolean>(true);

  const sequencerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resizeStepBoxes = () => {
      if (sequencerRef.current) {
        setParentWidth(sequencerRef.current.offsetWidth);
      }
    };

    window.addEventListener("resize", resizeStepBoxes);
    resizeStepBoxes(); // Initial sizing

    return () => {
      window.removeEventListener("resize", resizeStepBoxes);
    };
  }, []);

  useEffect(() => {
    if (isMouseDown) {
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMouseDown]);

  useEffect(() => {
    return () => {
      setIsMouseDown(false);
    };
  }, []);

  const calculateStepsHeight = () => {
    return parentWidth / NUM_OF_STEPS - STEP_BOXES_GAP;
  };

  const toggleStep = (index: number) => {
    setSequence((prevSequence: boolean[]) => {
      const newSequence = [...prevSequence];
      newSequence[index] = !newSequence[index];

      setSequences((prevSequences: Sequences) => {
        const newSequences = [...prevSequences];
        newSequences[slot][variation][0] = newSequence;
        return newSequences;
      });

      return newSequence;
    });
  };

  const toggleStepOnMouseDown = (node: number, nodeState: boolean) => {
    setIsMouseDown(true);
    setWriteState(!nodeState);
    toggleStep(node);
  };

  const toggleStepOnMouseOver = (node: number, nodeState: boolean) => {
    if (isMouseDown && nodeState !== isWriting) {
      toggleStep(node);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  return (
    <Box w="100%" ref={sequencerRef}>
      <Grid
        templateColumns={`repeat(${NUM_OF_STEPS}, 1fr)`}
        w="100%"
        h="100%"
        gap={`${STEP_BOXES_GAP}px`}
      >
        {Array.from({ length: NUM_OF_STEPS }, (_, index) => index).map(
          (node) => (
            <GridItem key={`sequenceNodeGridItem${node}`} colSpan={1}>
              <Box
                key={`sequenceNodeStepIndicator${node}`}
                mb={4}
                h="4px"
                w="100%"
                opacity={
                  node == step && isPlaying
                    ? 1
                    : [0, 4, 8, 12].includes(node)
                    ? 0.6
                    : 0.2
                }
                bg={node == step && isPlaying ? "darkorange" : "gray"}
              />
              <Box
                key={`sequenceNode${node}`}
                onMouseDown={() => toggleStepOnMouseDown(node, sequence[node])}
                onMouseEnter={() => toggleStepOnMouseOver(node, sequence[node])}
                w="100%"
                h={`${calculateStepsHeight()}px`}
                bg={sequence[node] ? "darkorange" : "transparent"}
                transition="all 0.2s ease"
                opacity={sequence[node] ? 1 : 0.5}
                outline="4px solid darkorange"
                borderRadius={`${calculateStepsHeight() / 4}px 0 ${
                  calculateStepsHeight() / 4
                }px 0`}
                _hover={{
                  background: "darkorange",
                }}
                transform="0.2s ease"
              />
            </GridItem>
          )
        )}
      </Grid>
    </Box>
  );
};
