import { useEffect, useMemo, useRef, useState } from "react";

import { runSimulation, runSimulationStream } from "../api";
import {
  DEFAULT_FORM,
  DEFAULT_REWARDS,
  DEFAULT_TRAINING_VIEW,
  TRAINING_REPLAY_INTERVAL_MS,
  TRAINING_STREAM_RENDER_INTERVAL_MS,
} from "../constants";
import { parseNumericInput } from "../utils/number";

export function useSimulationState({
  form,
  mazeDesign,
  designedMaze,
  setError,
  onExpandResults,
}) {
  const [simResult, setSimResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showTraining, setShowTraining] = useState(false);
  const [trainingView, setTrainingView] = useState(DEFAULT_TRAINING_VIEW);

  const streamQueueRef = useRef([]);
  const activeEpisodeRef = useRef(null);
  const skipLiveTrainingRef = useRef(false);

  useEffect(() => {
    if (!isAnimating || !simResult?.path?.length) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= simResult.path.length - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, TRAINING_REPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isAnimating, simResult]);

  useEffect(() => {
    if (!showTraining) {
      return undefined;
    }

    const timer = setInterval(() => {
      const activeEpisode = activeEpisodeRef.current;

      if (!activeEpisode) {
        const next = streamQueueRef.current.shift();
        if (!next) {
          setTrainingView((prev) => ({
            ...prev,
            buffered: streamQueueRef.current.length,
          }));
          return;
        }

        const nextPath = next.path || [];
        activeEpisodeRef.current = {
          completed: next.completed,
          total: next.total,
          path: nextPath,
          step: 0,
        };

        setTrainingView((prev) => ({
          ...prev,
          total: next.total || prev.total,
          path: nextPath,
          currentStep: 0,
          isEpisodeActive: true,
          buffered: streamQueueRef.current.length,
        }));
        return;
      }

      if (activeEpisode.step < activeEpisode.path.length - 1) {
        activeEpisode.step += 1;
        setTrainingView((prev) => ({
          ...prev,
          total: activeEpisode.total || prev.total,
          path: activeEpisode.path,
          currentStep: activeEpisode.step,
          isEpisodeActive: true,
          buffered: streamQueueRef.current.length,
        }));
        return;
      }

      activeEpisodeRef.current = null;
      setTrainingView((prev) => ({
        ...prev,
        completed: activeEpisode.completed || prev.completed + 1,
        total: activeEpisode.total || prev.total,
        buffered: streamQueueRef.current.length,
        isEpisodeActive: false,
      }));
    }, TRAINING_STREAM_RENDER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [showTraining]);

  const canRun = useMemo(() => Boolean(form.model_id) && !loading, [form.model_id, loading]);

  const displayMaze = simResult?.maze || designedMaze;
  const displayStart = simResult?.start || mazeDesign.start;
  const displayGoal = simResult?.goal || mazeDesign.goal;

  const hasLiveFrames = showTraining && (trainingView.isEpisodeActive || trainingView.buffered > 0);
  const livePath = hasLiveFrames ? trainingView.path : [];
  const displayPath = livePath.length > 0 ? livePath : simResult?.path || [];
  const displayCurrentStep = hasLiveFrames ? trainingView.currentStep : currentStep;

  function resetTrainingView() {
    skipLiveTrainingRef.current = false;
    streamQueueRef.current = [];
    activeEpisodeRef.current = null;
    setTrainingView(DEFAULT_TRAINING_VIEW);
  }

  function resetSimulationView() {
    setSimResult(null);
    setCurrentStep(0);
    setIsAnimating(false);
    resetTrainingView();
  }

  function handleSkipLiveTraining() {
    skipLiveTrainingRef.current = true;
    streamQueueRef.current = [];
    activeEpisodeRef.current = null;
    setTrainingView(DEFAULT_TRAINING_VIEW);
    setShowTraining(false);
  }

  function handleReplayPath() {
    setCurrentStep(0);
    setIsAnimating(true);
  }

  async function onRunSimulation() {
    setError("");
    setLoading(true);
    setIsAnimating(false);
    setSimResult(null);
    setCurrentStep(0);
    resetTrainingView();

    try {
      const payload = {
        model_id: form.model_id,
        episodes: parseNumericInput(form.episodes, DEFAULT_FORM.episodes),
        alpha: parseNumericInput(form.alpha, DEFAULT_FORM.alpha),
        gamma: parseNumericInput(form.gamma, DEFAULT_FORM.gamma),
        epsilon: parseNumericInput(form.epsilon, DEFAULT_FORM.epsilon),
        epsilon_decay: parseNumericInput(form.epsilon_decay, DEFAULT_FORM.epsilon_decay),
        max_steps: parseNumericInput(form.max_steps, DEFAULT_FORM.max_steps),
        rewards: {
          step_reward: parseNumericInput(form.rewards?.step_reward, DEFAULT_REWARDS.step_reward),
          wall_penalty: parseNumericInput(form.rewards?.wall_penalty, DEFAULT_REWARDS.wall_penalty),
          goal_reward: parseNumericInput(form.rewards?.goal_reward, DEFAULT_REWARDS.goal_reward),
        },
        maze: {
          size: mazeDesign.size,
          start: mazeDesign.start,
          goal: mazeDesign.goal,
          walls: mazeDesign.walls,
        },
      };

      const result = showTraining
        ? await runSimulationStream(payload, {
            onStarted: (event) => {
              if (skipLiveTrainingRef.current) {
                return;
              }
              setTrainingView((prev) => ({
                ...prev,
                total: event.episodes || payload.episodes,
              }));
            },
            onProgress: (event) => {
              if (skipLiveTrainingRef.current) {
                return;
              }
              streamQueueRef.current.push(event);
              setTrainingView((prev) => ({
                ...prev,
                total: event.total || prev.total,
                buffered: streamQueueRef.current.length,
              }));
            },
          })
        : await runSimulation(payload);

      setSimResult(result);
      setCurrentStep(0);
      setIsAnimating(true);
      onExpandResults();
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  return {
    simResult,
    loading,
    canRun,
    showTraining,
    setShowTraining,
    trainingView,
    onRunSimulation,
    handleReplayPath,
    handleSkipLiveTraining,
    resetSimulationView,
    displayMaze,
    displayStart,
    displayGoal,
    displayPath,
    displayCurrentStep,
  };
}
