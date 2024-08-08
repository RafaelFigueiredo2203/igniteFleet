import { useNavigation } from '@react-navigation/native';



import { useUser } from '@realm/react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import { CarStatus } from '../../components/CarStatus';
import { HistoricCard, HistoricCardProps } from '../../components/HistoricCard';
import { HomeHeader } from '../../components/HomeHeader';
import { useQuery, useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';
import { Container, Content, Label, Title } from './styles';

export function Home() {
  const [vehicleInUse, setVehicleInUse] =  useState<Historic | null>(null)
  const [vehicleHistoric, setVehicleHistoric] = useState<HistoricCardProps[]>();

  const { navigate } = useNavigation();
  const historic = useQuery(Historic)
  const realm = useRealm()
  const user = useUser()

  function handleRegisterMoviment() {
    if(vehicleInUse?._id){
      return navigate('arrival',{id: vehicleInUse?._id.toString()})
    }else{
      navigate('departure')
    }
  }

  function fetchVehicleInUse() {
    try {
      const vehicle = historic.filtered("status = 'departure")[0]
      setVehicleInUse(vehicle)
     
    } catch (error) {
      Alert.alert('Veículo em uso', 'Não foi possível carregar o veículo em uso ')
      console.log(error)
    }

  }

  function fetchHistoric() {
    try {
      const response = historic.filtered("status = 'arrival' SORT(created_at DESC")

    const formattedHistoric = response.map((item) => {
      return ({
        id: item._id.toString(),
        created: dayjs(item.created_at).format('[Saída em] DD/MM/YYYY [às] HH:mm'),
        licensePlate: item.license_plate,
        isSync: false
      })
    })


    setVehicleHistoric(formattedHistoric)
    } catch (error) {
      console.log(error)
      Alert.alert('Histórico', 'Não foi possível carregar o histórico ')
    }
  
  }

  function handleHistoricDetails(id:string){
    navigate('arrival', {id})
  }

  useEffect(() => {
    fetchVehicleInUse();
  }, [])

  useEffect(() => {
    fetchHistoric();
  }, [historic])

  useEffect(() => {
    realm.subscriptions.update((mutableSubs, realm) => {
      const historicByUserQuery = realm.objects('Historic').filtered(`user_id = '${user!.id}'`);

      mutableSubs.add(historicByUserQuery, { name: 'hostoric_by_user' });
    })
  },[realm]);


  return (
    <Container>
      <HomeHeader />

      <Content>
        <CarStatus licensePlate={vehicleInUse?.license_plate} onPress={handleRegisterMoviment} />

        <Title>
          Histórico
        </Title>

        <FlatList
        data={vehicleHistoric}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <HistoricCard
          data={item}
          onPress={() => handleHistoricDetails(item.id)}
        />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom:100}}
        ListEmptyComponent={(
          <Label>
            Nenhum veículo utilizado
          </Label>
        )}
        />
      </Content>
    </Container>
  );
}