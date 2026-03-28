from __future__ import annotations

from typing import Any, Dict, List

from .base import BaseRLModel


class SARSAModel(BaseRLModel):
    name = "sarsa"
    label = "SARSA"

    def train(self) -> Dict[str, Any]:
        episode_rewards: List[float] = []

        for _ in range(self.episodes):
            state, _ = self.env.reset()
            action = self.epsilon_greedy_action(state)
            total_reward = 0.0

            for _ in range(self.env.max_episode_steps):
                next_state, reward, done, truncated, _ = self.env.step(action)
                next_action = self.epsilon_greedy_action(next_state)

                td_target = reward + self.gamma * self.q_table[next_state, next_action] * (0.0 if done else 1.0)
                td_error = td_target - self.q_table[state, action]
                self.q_table[state, action] += self.alpha * td_error

                state, action = next_state, next_action
                total_reward += reward

                if done or truncated:
                    break

            episode_rewards.append(total_reward)

        return {
            "algorithm": self.label,
            "episodes": self.episodes,
            "mean_reward": round(float(sum(episode_rewards) / len(episode_rewards)), 4),
            "success_rate": round(self._success_rate(episode_rewards), 4),
            "episode_rewards": episode_rewards,
        }
