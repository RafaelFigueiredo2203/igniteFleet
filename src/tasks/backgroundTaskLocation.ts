import { Accuracy, hasStartedLocationUpdatesAsync, startLocationUpdatesAsync, stopLocationUpdatesAsync } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const BACKGORUND_TASK_NAME = 'location-tracking'

TaskManager.defineTask(BACKGORUND_TASK_NAME, async ({ data, error }: any) => {
  try {
    if(error){
      new error;
    }

  const {coords, timestamp}  = data.locations[0];
  
  const currentLocation = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp,
  }

  console.log(currentLocation)

  } catch (error ) {
      console.log(error)
  }
})

export async function startLocationTask(){
  try {
    const hashStarted = await hasStartedLocationUpdatesAsync(BACKGORUND_TASK_NAME)

    if(!hashStarted){
      await startLocationTask()
    }

    await startLocationUpdatesAsync(BACKGORUND_TASK_NAME,{
      accuracy: Accuracy.Highest,
      distanceInterval: 1,
      timeInterval: 1000,
    })
  } catch (error) {
    console.log(error)
  }
}

export async function stopLocationTask(){
  try {
    const hashStarted = await hasStartedLocationUpdatesAsync(BACKGORUND_TASK_NAME)

    if(hashStarted){
      await stopLocationUpdatesAsync(BACKGORUND_TASK_NAME)
    }


  } catch (error) {
    console.log(error)
  }
}