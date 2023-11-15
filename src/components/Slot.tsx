"use client";

import { SlotData } from "@/types/types";
import { Box, Button, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import "@fontsource-variable/pixelify-sans";
import { Knob, transformKnobValue } from "./Knob";
import { useEffect, useRef, useState } from "react";
import Waveform from "./Waveform";
import { useSampleDuration } from "@/hooks/useSampleDuration";

type SlotParams = {
  data: SlotData;
  setReleases: React.Dispatch<React.SetStateAction<number[]>>;
};

export const Slot: React.FC<SlotParams> = ({ data, setReleases }) => {
  const [volume, setVolume] = useState(data.volume); // 0-100
  const [attack, setAttack] = useState(data.attack);
  const [release, setRelease] = useState(data.release);
  const [waveWidth, setWaveWidth] = useState<number>(200);
  const waveButtonRef = useRef<HTMLButtonElement>(null);
  const sampleDuration = useSampleDuration(
    data.sample.sampler,
    data.sample.url
  );

  useEffect(() => {
    const newAttackValue = transformKnobValue(attack, [0, 1]);
    data.sample.sampler.attack = newAttackValue;
  }, [attack, data.sample.sampler.attack, data.sample.sampler]);

  useEffect(() => {
    const newVolumeValue = transformKnobValue(volume, [-30, 0]);
    data.sample.sampler.volume.value = newVolumeValue;
  }, [volume, data.sample.sampler.volume]);

  useEffect(() => {
    const maintainWaveformSize = () => {
      if (waveButtonRef.current) {
        setWaveWidth(waveButtonRef.current.clientWidth);
      }
    };

    window.addEventListener("resize", maintainWaveformSize);
    maintainWaveformSize();

    return () => {
      window.removeEventListener("resize", maintainWaveformSize);
    };
  }, []);

  useEffect(() => {
    setReleases((prevReleases) => {
      const newReleases = [...prevReleases];
      newReleases[data.id] = release;
      return newReleases;
    });
  }, [release, data.id]);

  const playSample = () => {
    data.sample.sampler.triggerRelease("C2");
    data.sample.sampler.triggerAttackRelease(
      "C2",
      transformKnobValue(release, [0.0001, sampleDuration])
    );
  };

  return (
    <>
      <Box w="100%" key={`Slot-${data.sample.name}`} p={4}>
        <Heading className="slot" as="h2">
          {data.sample.name}
        </Heading>
        <Text
          key={`filename-${data.sample.name}`}
          className="filename"
          fontFamily={`'Pixelify Sans Variable', sans-serif`}
          color="gray"
        >
          {data.sample.url.split("/").pop()}
        </Text>
        <Button
          ref={waveButtonRef}
          w="100%"
          h="60px"
          onMouseDown={() => playSample()}
          bg="transparent"
        >
          <Waveform audioFile={data.sample.url} width={waveWidth} />
        </Button>

        <Grid templateColumns="repeat(2, 1fr)">
          <GridItem>
            <Knob
              key={`knob-${data.id}-attack`}
              size={60}
              knobValue={attack}
              setKnobValue={setAttack}
              knobTitle="ATTACK"
            />
          </GridItem>
          <GridItem>
            <Knob
              key={`knob-${data.id}-release`}
              size={60}
              knobValue={release}
              setKnobValue={setRelease}
              knobTitle="RELEASE"
            />
          </GridItem>
          <GridItem />
          <GridItem>
            <Knob
              key={`knob-${data.id}-volume`}
              size={60}
              knobValue={volume}
              setKnobValue={setVolume}
              knobTitle="VOLUME"
              knobTransformRange={[-30, 0]}
              knobUnits="dB"
            />
          </GridItem>
        </Grid>
      </Box>

      {/* Divider Line */}
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
