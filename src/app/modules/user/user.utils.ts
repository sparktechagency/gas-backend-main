// import cron from 'node-cron';
// import { User } from './user.models';

// // Runs every day at midnight
// cron.schedule('*/5 * * * * *', async () => {
//   try {
//     const users = await User.find({ durationDay: { $gt: 0 } });

//     for (const user of users) {
//       const remeningDurationDay = user.durationDay - 1;
//       await User.updateOne(
//         { _id: user._id },
//         { $set: { remeningDurationDay } },
//       );
//     }

//     console.log('User durations updated.');
//   } catch (error) {
//     console.error('Error running user duration cron:', error);
//   }
// });
