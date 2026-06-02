import { redirect } from 'next/navigation';

// The take-off-ladder screen is the implemented deliverable.
// Root lands there so `next dev` opens directly onto it.
export default function Home() {
  redirect('/takeoff/ladder');
}
