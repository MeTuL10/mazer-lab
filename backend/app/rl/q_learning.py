from __future__ import annotations

from typing import Any, Dict, List

from .base import BaseRLModel


class QLearningModel(BaseRLModel):
    name = "q_learning"
    label = "Q-Learning"

    def train(self) -> Dict[str, Any]:
        episode_rewards: List[float] = []

        for episode_index in range(1, self.episodes + 1):
            state, _ = self.env.reset()
            total_reward = 0.0
            episode_path = [list(self.env.state_to_coord(state))]

            for _ in range(self.env.max_episode_steps):
                action = self.epsilon_greedy_action(state)
                next_state, reward, done, truncated, _ = self.env.step(action)

                best_next = self.q_table[next_state].max()
                td_target = reward + self.gamma * best_next * (0.0 if done else 1.0)
                td_error = td_target - self.q_table[state, action]
                self.q_table[state, action] += self.alpha * td_error

                state = next_state
                episode_path.append(list(self.env.state_to_coord(state)))
                total_reward += reward

                if done or truncated:
                    break

            episode_rewards.append(total_reward)
            self._report_progress(episode_index, episode_path)

        return {
            "algorithm": self.label,
            "episodes": self.episodes,
            "mean_reward": round(float(sum(episode_rewards) / len(episode_rewards)), 4),
            "success_rate": round(self._success_rate(episode_rewards), 4),
            "episode_rewards": episode_rewards,
        }
