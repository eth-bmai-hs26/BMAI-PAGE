import type { CodingExercise } from '../types';
import { ExerciseItem } from './Chips';
import { exerciseId, isSoon } from '../lib/exercises';

/**
 * Every coding exercise of the weekend, easiest first: the easy ones, then the
 * hard ones, each with the reference to open beside it, then those not
 * uploaded yet. Demos are not exercises and stay on their schedule row.
 */
export function ExerciseList({
  exercises,
  done,
  onToggle,
}: {
  exercises: CodingExercise[];
  done: string[];
  onToggle: (id: string) => void;
}) {
  const ranked = exercises
    .filter((e) => !e.demo && !isSoon(e.url))
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const groups = [
    { title: 'Easy', items: ranked.filter((e) => e.level !== 'hard') },
    { title: 'Hard', items: ranked.filter((e) => e.level === 'hard') },
    { title: 'Not uploaded yet', items: exercises.filter((e) => !e.demo && isSoon(e.url)) },
  ].filter((g) => g.items.length > 0);

  return (
    <section className="xlist">
      <h2>Coding exercises, easiest first</h2>
      <p className="xlist__note">
        Every coding exercise of the weekend, ranked from the easiest to the hardest. Beside each
        one, the worked example or the visualization to open when you are stuck. Tick an exercise
        once you have done it.
      </p>
      {groups.map((g) => (
        <div className="xlist__group" key={g.title}>
          <h3 className="xlist__title">{g.title}</h3>
          {g.items.map((e) => (
            <ExerciseItem
              key={exerciseId(e)}
              ex={e}
              isDone={done.includes(exerciseId(e))}
              onToggle={() => onToggle(exerciseId(e))}
              showWhen
            />
          ))}
        </div>
      ))}
    </section>
  );
}
