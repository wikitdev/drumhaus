"use client";

import * as init from "@/lib/init";
import { Kit, Preset, Sample, Sequences } from "@/types/types";
import { Box, Button, Center, Grid, GridItem, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone/build/esm/index";
import { Sequencer } from "./Sequencer";
import { SlotsGrid } from "./SlotsGrid";
import { IoPlaySharp, IoPauseSharp } from "react-icons/io5";
import { TransportControl } from "./TransportControl";
import {
  Knob,
  transformKnobValue,
  transformKnobValueExponential,
} from "./Knob";
import { SequencerControl } from "./SequencerControl";
import { MasterFX } from "./MasterFX";
import { MasterCompressor } from "./MasterCompressor";
import { PresetControl } from "./PresetControl";
import { DrumhausLogo } from "./svg/DrumhausLogo";
import { SignatureLogo } from "./svg/SignatureLogo";
import makeGoodMusic from "@/lib/makeGoodMusic";

const Drumhaus = () => {
  const [preset, setPreset] = useState<Preset>({
    name: "init",
    _kit: init._kit,
    _bpm: init._bpm,
    _swing: init._swing,
    _lowPass: init._lowPass,
    _hiPass: init._hiPass,
    _phaser: init._phaser,
    _reverb: init._reverb,
    _compThreshold: init._compThreshold,
    _compRatio: init._compRatio,
    _masterVolume: init._masterVolume,
    _sequences: init._sequences,
    _variation: init._variation,
    _chain: init._chain,
  });
  // g l o b a l
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState(0); // 0 - 15
  const [slotIndex, setSlotIndex] = useState<number>(0); // 0-7
  const [samples, setSamples] = useState<Sample[]>(init._samples);
  const [kit, setKit] = useState<Kit>(preset._kit);
  const [sequences, setSequences] = useState<Sequences>(preset._sequences);
  const [variation, setVariation] = useState<number>(preset._variation); // A = 0, B = 1
  const [chain, setChain] = useState<number>(preset._chain); // A = 0, B = 1, AB = 2, AAAB = 3
  const [currentSequence, setCurrentSequence] = useState<boolean[]>(
    preset._sequences[slotIndex][variation][0]
  );

  // m a s t e r   c o n t r o l s
  const [bpm, setBpm] = useState(preset._bpm);
  const [swing, setSwing] = useState(preset._swing);
  const [lowPass, setLowPass] = useState(preset._lowPass);
  const [hiPass, setHiPass] = useState(preset._hiPass);
  const [phaser, setPhaser] = useState(preset._phaser);
  const [reverb, setReverb] = useState(preset._reverb);
  const [compThreshold, setCompThreshold] = useState(preset._compThreshold);
  const [compRatio, setCompRatio] = useState(preset._compRatio);
  const [masterVolume, setMasterVolume] = useState(preset._masterVolume);

  // s l o t s
  const [attacks, setAttacks] = useState<number[]>(kit._attacks);
  const [releases, setReleases] = useState<number[]>(kit._releases);
  const [filters, setFilters] = useState<number[]>(kit._filters);
  const [volumes, setVolumes] = useState<number[]>(kit._volumes);
  const [pans, setPans] = useState<number[]>(kit._pans);
  const [mutes, setMutes] = useState<boolean[]>(kit._mutes);
  const [solos, setSolos] = useState<boolean[]>(kit._solos);
  const [durations, setDurations] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  // r e f s
  const toneSequence = useRef<Tone.Sequence | null>(null);
  const toneLPFilter = useRef<Tone.Filter>();
  const toneHPFilter = useRef<Tone.Filter>();
  const tonePhaser = useRef<Tone.Phaser>();
  const toneReverb = useRef<Tone.Reverb>();
  const toneCompressor = useRef<Tone.Compressor>();
  const bar = useRef<number>(0);
  const chainVariation = useRef<number>(0);

  // m e m o i z a t i o n
  const sequencesCache = useMemo(() => sequences, [sequences]);
  const releasesCache = useMemo(() => releases, [releases]);
  const chainCache = useMemo(() => chain, [chain]);
  const mutesCache = useMemo(() => mutes, [mutes]);
  const solosCache = useMemo(() => solos, [solos]);
  const samplesCache = useMemo(() => samples, [samples]);

  // m a k e   g o o d   m u s i c
  useEffect(() => {
    if (isPlaying) {
      makeGoodMusic(
        toneSequence,
        samplesCache,
        releasesCache,
        durations,
        chainCache,
        bar,
        chainVariation,
        solosCache,
        sequencesCache,
        mutesCache,
        setStepIndex
      );
    }

    return () => {
      toneSequence.current?.dispose();
    };
  }, [isPlaying, releases, chain, mutes, solos, samples]);

  useEffect(() => {
    function setFromPreset(_preset: Preset) {
      setSlotIndex(0);
      setCurrentSequence(_preset._sequences[0][0][0]);
      setDurations([0, 0, 0, 0, 0, 0, 0, 0]);
      setVariation(0);
      setKit(_preset._kit);
      setSequences(_preset._sequences);
      setBpm(_preset._bpm);
      setSwing(_preset._swing);
      setLowPass(_preset._lowPass);
      setHiPass(_preset._hiPass);
      setPhaser(_preset._phaser);
      setReverb(_preset._reverb);
      setCompThreshold(_preset._compThreshold);
      setCompRatio(_preset._compRatio);
      setMasterVolume(_preset._masterVolume);
      setChain(_preset._chain);
    }

    setFromPreset(preset);
  }, [preset]);

  useEffect(() => {
    const newSamples = init.createSamples(kit.samples);
    setSamples(newSamples);
    setAttacks(kit._attacks);
    setReleases(kit._releases);
    setFilters(kit._filters);
    setPans(kit._pans);
    setVolumes(kit._volumes);
    setSolos(kit._solos);
    setMutes(kit._mutes);
  }, [kit]);

  useEffect(() => {
    const playViaSpacebar = (event: KeyboardEvent) => {
      if (event.key === " ") togglePlay();
    };

    document.addEventListener("keydown", playViaSpacebar);

    return () => {
      document.removeEventListener("keydown", playViaSpacebar);
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    const newSwing = transformKnobValue(swing, [0, 0.5]);
    Tone.Transport.swingSubdivision = "16n";
    Tone.Transport.swing = newSwing;
  }, [swing]);

  useEffect(() => {
    setMasterChain();

    return () => {
      toneLPFilter.current?.dispose();
      toneHPFilter.current?.dispose();
      tonePhaser.current?.dispose();
      toneReverb.current?.dispose();
      toneCompressor.current?.dispose();
    };

    function setMasterChain() {
      toneLPFilter.current = new Tone.Filter(15000, "lowpass");
      toneHPFilter.current = new Tone.Filter(0, "highpass");
      tonePhaser.current = new Tone.Phaser({
        frequency: 5,
        octaves: 4,
        baseFrequency: 1000,
      });
      toneReverb.current = new Tone.Reverb(1);
      toneCompressor.current = new Tone.Compressor({
        threshold: 0,
        ratio: 1,
        attack: 0.5,
        release: 1,
      });

      if (
        toneLPFilter.current &&
        toneHPFilter.current &&
        tonePhaser.current &&
        toneReverb.current &&
        toneCompressor.current
      ) {
        samples.forEach((sample) => {
          sample.sampler.chain(
            sample.envelope,
            sample.filter,
            sample.panner,
            toneLPFilter.current!!,
            toneHPFilter.current!!,
            tonePhaser.current!!,
            toneReverb.current!!,
            toneCompressor.current!!,
            Tone.Destination
          );
        });
      }
    }
  }, [samples]);

  useEffect(() => {
    const newLowPass = transformKnobValueExponential(lowPass, [0, 15000]);
    if (toneLPFilter.current) {
      toneLPFilter.current.frequency.value = newLowPass;
    }
  }, [lowPass, samples]);

  useEffect(() => {
    const newHiPass = transformKnobValueExponential(hiPass, [0, 15000]);
    if (toneHPFilter.current) {
      toneHPFilter.current.frequency.value = newHiPass;
    }
  }, [hiPass, samples]);

  useEffect(() => {
    const newPhaserWet = transformKnobValue(phaser, [0, 1]);
    if (tonePhaser.current) {
      tonePhaser.current.wet.value = newPhaserWet;
    }
  }, [phaser, samples]);

  useEffect(() => {
    const newReverbWet = transformKnobValue(reverb, [0, 0.5]);
    const newReverbDecay = transformKnobValue(reverb, [0.1, 3]);
    if (toneReverb.current) {
      toneReverb.current.wet.value = newReverbWet;
      toneReverb.current.decay = newReverbDecay;
    }
  }, [reverb, samples]);

  useEffect(() => {
    const newCompThreshold = transformKnobValue(compThreshold, [-40, 0]);
    if (toneCompressor.current) {
      toneCompressor.current.threshold.value = newCompThreshold;
    }
  }, [compThreshold, samples]);

  useEffect(() => {
    const newCompRatio = Math.floor(transformKnobValue(compRatio, [1, 8]));
    if (toneCompressor.current) {
      toneCompressor.current.ratio.value = newCompRatio;
    }
  }, [compRatio, samples]);

  useEffect(() => {
    const newMasterVolume = transformKnobValue(masterVolume, [-46, 4]);
    Tone.Destination.volume.value = newMasterVolume;
  }, [masterVolume]);

  useEffect(() => {
    const newCurrentSequence: boolean[] = sequences[slotIndex][variation][0];
    setCurrentSequence(newCurrentSequence);
    // Prop drilling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variation]);

  const togglePlay = async () => {
    await Tone.start();

    setIsPlaying((prevIsPlaying) => {
      if (!prevIsPlaying) Tone.Transport.start();
      else Tone.Transport.stop();
      return !prevIsPlaying;
    });
  };

  return (
    <Box
      bg="silver"
      w={1538}
      h={1000}
      style={{ userSelect: "none" }}
      borderRadius="12px"
      className="neumorphicExtraTall"
      m="auto"
      position="absolute"
      inset={0}
      overflow="clip"
    >
      <Box
        h="120px"
        boxShadow="0 4px 8px rgba(176, 147, 116, 0.6)"
        position="relative"
      >
        <Box zIndex={999} position="absolute" left={0} top="17px">
          <DrumhausLogo size={100} color="#ff7b00" />
        </Box>
        <Text
          id="logo"
          variant="logo"
          fontSize={100}
          color="darkorange"
          fontFamily="Mandala"
          px={6}
          position="absolute"
          top={-4}
          left={14}
          fontWeight={900}
        >
          drumhaus
        </Text>
        <Text
          color="gray"
          position="absolute"
          left={520}
          bottom={9}
          opacity={0.7}
        >
          Browser Controlled
        </Text>
        <Text
          color="gray"
          position="absolute"
          left={520}
          bottom={4}
          opacity={0.7}
        >
          Rhythmic Groove Machine
        </Text>
        <SignatureLogo
          width={80}
          fill="#B09374"
          position="absolute"
          right={6}
          top={14}
          opacity={0.5}
          as="a"
          href="https://www.maxfung.net/"
          target="_blank"
        />
      </Box>

      <Box boxShadow="0 4px 8px rgba(176, 147, 116, 0.6)">
        <SlotsGrid
          samples={samples}
          variation={variation}
          sequences={sequences}
          setCurrentSequence={setCurrentSequence}
          slotIndex={slotIndex}
          setSlotIndex={setSlotIndex}
          attacks={attacks}
          setAttacks={setAttacks}
          releases={releases}
          setReleases={setReleases}
          filters={filters}
          setFilters={setFilters}
          volumes={volumes}
          setVolumes={setVolumes}
          pans={pans}
          setPans={setPans}
          mutes={mutes}
          setMutes={setMutes}
          solos={solos}
          setSolos={setSolos}
          setDurations={setDurations}
        />
      </Box>

      <Grid templateColumns="repeat(7, 1fr)" px={4} py={6} w="100%">
        <GridItem colSpan={1} w="160px">
          <Center w="100%" h="100%">
            <Button
              h="140px"
              w="140px"
              onClick={() => togglePlay()}
              className="neumorphicTallRaised"
              outline="none"
            >
              {isPlaying ? (
                <IoPauseSharp size={50} color="#ff7b00" />
              ) : (
                <IoPlaySharp size={50} color="#B09374" />
              )}
            </Button>
          </Center>
        </GridItem>

        <GridItem colSpan={1}>
          <SequencerControl
            variation={variation}
            setVariation={setVariation}
            chain={chain}
            setChain={setChain}
            currentSequence={currentSequence}
            setCurrentSequence={setCurrentSequence}
            slot={slotIndex}
            sequences={sequences}
            setSequences={setSequences}
          />
        </GridItem>

        <GridItem colSpan={1}>
          <TransportControl
            bpm={bpm}
            setBpm={setBpm}
            swing={swing}
            setSwing={setSwing}
          />
        </GridItem>

        <GridItem w="380px" pl={0} pr={6}>
          <PresetControl
            preset={preset}
            setPreset={setPreset}
            kit={kit}
            setKit={setKit}
            bpm={bpm}
            swing={swing}
            lowPass={lowPass}
            hiPass={hiPass}
            phaser={phaser}
            reverb={reverb}
            compThreshold={compThreshold}
            compRatio={compRatio}
            masterVolume={masterVolume}
            sequences={sequences}
            attacks={attacks}
            releases={releases}
            filters={filters}
            volumes={volumes}
            pans={pans}
            solos={solos}
            mutes={mutes}
            chain={chain}
          />
        </GridItem>

        <GridItem colSpan={1} w={120}>
          <MasterFX
            lowPass={lowPass}
            setLowPass={setLowPass}
            hiPass={hiPass}
            setHiPass={setHiPass}
            phaser={phaser}
            setPhaser={setPhaser}
            reverb={reverb}
            setReverb={setReverb}
          />
        </GridItem>

        <GridItem colSpan={1}>
          <MasterCompressor
            threshold={compThreshold}
            setThreshold={setCompThreshold}
            ratio={compRatio}
            setRatio={setCompRatio}
          />
        </GridItem>

        <GridItem colSpan={1} w={140}>
          <Knob
            size={140}
            knobValue={masterVolume}
            setKnobValue={setMasterVolume}
            knobTitle="MASTER VOLUME"
            knobTransformRange={[-46, 4]}
            knobUnits="dB"
          />
        </GridItem>
      </Grid>

      <Box p={8} boxShadow="0 4px 8px rgba(176, 147, 116, 0.6)">
        <Sequencer
          sequence={currentSequence}
          setSequence={setCurrentSequence}
          sequences={sequences}
          setSequences={setSequences}
          variation={variation}
          slot={slotIndex}
          step={stepIndex}
          isPlaying={isPlaying}
        />
      </Box>
    </Box>
  );
};

export default Drumhaus;
