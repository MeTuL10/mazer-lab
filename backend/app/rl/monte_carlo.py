from __future__ import annotations

from typing import Any, Dict, List, Tuple

from .base import BaseRLModel


class MonteCarloModel(BaseRLModel):
    name = "monte_carlo"
    label = "Monte Carlo Control"

    def train(self) -> Dict[str, Any]:
        episode_rewards: List[float] = []

        for episode_index in range(1, self.episodes + 1):
            episode: List[Tuple[int, int, float]] = []
            state, _ = self.env.reset()
            total_reward = 0.0
            episode_path = [list(self.env.state_to_coord(state))]

            for _ in range(self.env.max_episode_steps):
                action = self.epsilon_greedy_action(state)
                next_state, reward, done, truncated, _ = self.env.step(action)
                episode.append((state, action, reward))
                state = next_state
                episode_path.append(list(self.env.state_to_coord(state)))
                total_reward += reward

                if done or truncated:
                    break

            g_return = 0.0
            visited_pairs = set()
            for state, action, reward in reversed(episode):
                g_return = self.gamma * g_return + reward
                key = (state, action)
                if key in visited_pairs:
                    continue
                visited_pairs.add(key)
                self.q_table[state, action] += self.alpha * (
                    g_return - self.q_table[state, action]
                )

            episode_rewards.append(total_reward)
            self._report_progress(episode_index, episode_path)

        return {
            "algorithm": self.label,
            "episodes": self.episodes,
            "mean_reward": round(float(sum(episode_rewards) / len(episode_rewards)), 4),
            "success_rate": round(self._success_rate(episode_rewards), 4),
            "episode_rewards": episode_rewards,
        }
