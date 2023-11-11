"use client";

import { SlotData } from "@/types/types";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import "@fontsource-variable/pixelify-sans";

type SlotParams = {
  data: SlotData;
};

export const Slot: React.FC<SlotParams> = ({ data }) => {
  const playSample = () => {
    data.sampler.sampler.triggerAttack("C2");
  };

  return (
    <>
      <Box key={`Slot-${data.name}`} p={4}>
        <Heading className="slot" as="h2">
          {data.name}
        </Heading>
        <Text
          key={`filename-${data.name}`}
          className="filename"
          css={{
            fontFamily: `'Pixelify Sans Variable', sans-serif`,
          }}
        >
          {data.sampler.url}
        </Text>
        <Button onClick={() => playSample()} />
      </Box>
      {data.id > 0 ? (
        <Box
          key={`line-${data.id}`}
          bg="gray"
          w="2px"
          h="100%"
          position="absolute"
          left={0}
          top={0}
        />
      ) : null}
    </>
  );
};
