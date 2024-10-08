import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, TextInput } from 'react-native';

import { Header } from '../../components/Header';
import { LicensePlateInput } from '../../components/LicensePlateInput';
import { TextAreaInput } from '../../components/TextAreaInput';

import { useNavigation } from '@react-navigation/native';
import { useUser } from '@realm/react';
import { LocationAccuracy, LocationObjectCoords, LocationSubscription, requestBackgroundPermissionsAsync, useForegroundPermissions, watchPositionAsync } from 'expo-location';
import { Car } from 'phosphor-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { LocationInfo } from '../../components/LocationInfo';
import { Map } from '../../components/Map';
import { useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';
import { startLocationTask } from '../../tasks/backgroundTaskLocation';
import { getAddressLocation } from '../../utils/getAddressLocation';
import { licensePlateValidate } from '../../utils/licensePlateValidate';
import { openSettings } from '../../utils/oppenSettings';
import { Container, Content, Message, MessageContent } from './styles';



export function Departure() {

  const [description, setDescription] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [currentAddress, setCurrentAddress] = useState<string | null>()
  const [currentCoord, setCurrentCoord] = useState<LocationObjectCoords | null>(null)

  const [locationForegroundPermission, requestLocationForegroundPermission] = useForegroundPermissions()

  const descriptionRef = useRef<TextInput>(null);
  const licensePlateRef = useRef<TextInput>(null);

  const realm = useRealm()
  const user = useUser()
  const {goBack} = useNavigation()

  async function handleDepartureRegister() {
    try{
      if(!licensePlateValidate(licensePlate)) {
        licensePlateRef.current?.focus();
        return Alert.alert('Placa inválida', 'A placa é inválida. Por favor, informa a placa correta.')
      }
  
      if(description.trim().length === 0){
        descriptionRef.current?.focus();
        return  Alert.alert('Finalidade', 'Por favor , informe a finalidade da utilização do veículo!');
      }

      if(!currentCoord?.latitude && ! currentCoord?.longitude){
        return  Alert.alert('Localização', 'Não foi possível recuperar a localização. Verifique se o GPS está ativado.');
        
      }

      setIsRegistering(true)

      const backgroundPermissions = await requestBackgroundPermissionsAsync();

      if(!backgroundPermissions.granted){
        setIsRegistering(false)
        return Alert.alert(
          'Localização', 
          'É necessário permitir que o App tenha acesso localização em segundo plano. Acesse as configurações do dispositivo e habilite "Permitir o tempo todo."',
          [{ text: 'Abrir configurações', onPress: openSettings }]
        )
      }

      await startLocationTask();

      realm.write(() => {
        realm.create('Historic', Historic.generate({
          user_id:user!.id,
          license_plate: licensePlate.toUpperCase(),
          description,
          coords: [{
            latitude: currentCoord.latitude!, 
            longitude: currentCoord.longitude!, 
            timestamp: new Date().getTime()}],
          
        }))
      });

      Alert.alert('Saída', 'Saída do veículo registrada com sucesso!');
      goBack()

    }catch(error){
      console.log(error)
      Alert.alert('Erro', 'Ocorreu um erro ao registrar a saída.')
      setIsRegistering(false)
    }
  }

  useEffect(() => {
    requestLocationForegroundPermission();
  },[])

  useEffect(() => {

    if(!locationForegroundPermission?.granted){
      return;
    }

    let subscription : LocationSubscription;

    watchPositionAsync({
      accuracy: LocationAccuracy.High,
      timeInterval: 1000,
    }, (location) => {
    setCurrentCoord(location.coords)
     getAddressLocation(location.coords)
     .then((address) => {
      if(address){
        setCurrentAddress(address);
      }
     }).finally(() => setIsLoadingLocation(false))
    }).then((response) => subscription = response);

    return () => {
      if(subscription){
        subscription.remove()
      }
    };
  },[locationForegroundPermission])

  if(!locationForegroundPermission?.granted){
    return(
      <Container>
        <Header title="Saída"/>
        <MessageContent>
          <Message>
            Você precisa permitir que o aplicativo tenha acesso a 
            localização para acessar essa funcionalidade. Por favor, acesse as
            configurações do seu dispositivo para conceder a permissão ao aplicativo.
          </Message>

          <Button title='Abrir configurações' onPress={openSettings} />
        </MessageContent>
      </Container>
    )
  }

  if(isLoadingLocation){
    return(
     <Loading/>
    )
  }

  return (
    <Container>
      <Header title='Saída' />

      <KeyboardAwareScrollView  extraHeight={100} >
        <ScrollView>
          {currentCoord && <Map coordinates={[currentCoord]}/>}
          <Content>

            {
              currentAddress && (
                <LocationInfo
                icon={Car}
                label='Localização atual'
                description={currentAddress}
                />
              )
            }

            <LicensePlateInput
              ref={licensePlateRef}
              label='Placa do veículo'
              placeholder="BRA1234"
              onSubmitEditing={() => {
                descriptionRef.current?.focus()
              }}
              returnKeyType='next'
              onChangeText={setLicensePlate}
            />




            <TextAreaInput
              ref={descriptionRef}
              label='Finalidade'
              placeholder='Vou utilizar o veículo para...'
              onSubmitEditing={handleDepartureRegister}
              returnKeyType='send'
              blurOnSubmit
              onChangeText={setDescription}
            />

            <Button
              title='Registar Saída'
              onPress={handleDepartureRegister}
              isLoading={isRegistering}
            />
          </Content>
        </ScrollView>
      </KeyboardAwareScrollView>
    </Container>
  );
}