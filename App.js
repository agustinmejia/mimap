import React, { Component } from 'react';
import {
  SafeAreaView,
  Image,
  Text,
  Dimensions,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ToastAndroid
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlashMessage from "react-native-flash-message";
import { showMessage } from "react-native-flash-message";

import Icon from 'react-native-vector-icons/AntDesign';

// Config
import { env } from './src/config';

const screenWidth = Math.round(Dimensions.get('window').width);
const screenHeight = Math.round(Dimensions.get('window').height);

export default class RaceList extends Component {
  constructor(props) {
      super(props);
      this.state = {
        initialLat : env.location.latitude,
        initialLon: env.location.longitude,
        region: {
          latitude: env.location.latitude,
          longitude: env.location.longitude,
          latitudeDelta: 0.0422,
          longitudeDelta: screenWidth / (screenHeight - 130) * 0.0422
        },
        loading: true,
        showMainMarker: false,
        showOptions: false,
        newLocation: {
          title: '',
          description: '',
          type: '',
          latitude: null,
          longitude: null,

        },
        modalNewLocationShow: false,
        locationsList: []
      }
  }

  async componentDidMount(){
    setTimeout(() => {
      this.setState({loading: false});
    }, 3000);
    let locationsList = await AsyncStorage.getItem('@locations');
    this.setState({locationsList: locationsList ? JSON.parse(locationsList) : []});
  }

  getCurrentLocation(){
    Geolocation.getCurrentPosition(position => {
      let {title, description, type} = this.state.newLocation;
      let newLocation = {
        title, description, type,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      this.setState({
        region: {
            ...this.state.region,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        },
        markerOpacity: 1,
        markerTitle: 'Ubicación actual',
        markerDescription: 'Ubicación obtenida según tu GPS.',
        showMainMarker: true,
        newLocation
      }, () => {
        // Change map center
        this.map.animateToRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: this.state.region.latitudeDelta,
          longitudeDelta: this.state.region.longitudeDelta
        });
      });
    });
  }

  handleSaveLocation(){
    let {title, description, type, latitude, longitude} = this.state.newLocation;
    if(!title){
      ToastAndroid.showWithGravity(
        "Debes ingresar un título para la ubicación.",
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM
      );
      return 0;
    }
    let newLocation = {
      title, description, type, latitude, longitude
    };
    let locationsList = this.state.locationsList;
    locationsList.push(newLocation);
    this.setState({
      locationsList,
      modalNewLocationShow: false,
      newLocation: {
        title: '',
        description: '',
        type: '',
        latitude: null,
        longitude: null,
      },
      showMainMarker: false,
    });

    AsyncStorage.setItem('@locations', JSON.stringify(locationsList));

    showMessage({
      message: "Ubicación guardada correctamente.",
      type: "success",
    });
  }

  render(){
    if(this.state.loading){
      return <SplashScreen />
    }
    return (
      <SafeAreaView style={styles.container}>
        <MapView
          ref={map => {this.map = map}}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={this.state.region}
          onPress={(e) => {
            let location = e.nativeEvent.coordinate;
            let {title, description, type} = this.state.newLocation;
            let newLocation = {
              title, description, type,
              latitude: location.latitude,
              longitude: location.longitude,
            }
            this.setState({
              region: {
                  ...this.state.region,
                  latitude: location.latitude,
                  longitude: location.longitude,
              },
              markerOpacity: 1,
              markerTitle: 'Ubicación actual',
              markerDescription: 'Ubicación seleccionada.',
              showMainMarker: true,
              newLocation
            });
          }}
        >
          <Marker
            coordinate={
              { 
                latitude: this.state.region.latitude,
                longitude: this.state.region.longitude
              }
            }
            title={this.state.markerTitle}
            description={this.state.markerDescription}
            opacity={this.state.showMainMarker ? 1 : 0}
            draggable
            onDragEnd={(e) => {
              let location = e.nativeEvent.coordinate;
              let {title, description, type} = this.state.newLocation;
              let newLocation = {
                title, description, type,
                latitude: location.latitude,
                longitude: location.longitude,
              }
              this.setState({newLocation});
            }}
          >
            <Image
              source={require('./src/assets/images/marker.png')}
              style={{ width: 50, height: 50 }}
            />
          </Marker>

          {
            this.state.locationsList.map((location, index) => {
              return (
                <Marker
                  key={index}
                  coordinate={
                    { 
                      latitude: location.latitude,
                      longitude: location.longitude
                    }
                  }
                  title={location.title}
                  description={location.description}
                >
                  <Image
                    source={require('./src/assets/images/marker-alt.png')}
                    style={{ width: 60, height: 60 }}
                  />
                </Marker>
              )
            })
          }
        </MapView>

        {/* Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalNewLocationShow}
          onRequestClose={()=> this.setState({modalNewLocationShow: false})}
        >
          <View style={{flex:1, backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <View style={{position: 'absolute', bottom: 0, left: 0, width: screenWidth, backgroundColor: '#fff', borderTopRightRadius: 10, borderTopLeftRadius: 10}}>
              <View style={{paddingHorizontal: 30, paddingVertical: 20}}>
                <View style={{alignContent: 'center', alignItems: 'center'}}>
                  <Text style={{fontWeight: 'bold', fontSize: 15}}>Datos de la ubicación</Text>
                </View>
                <View>
                  <Text>Título</Text>
                  <TextInput
                    style={styles.textInput}
                    value={this.state.newLocation.title}
                    onChangeText={text => {
                      let {newLocation} = this.state;
                      newLocation = {
                        ...newLocation,
                        title: text
                      }
                      this.setState({newLocation});
                    }}
                    placeholder="Domicilio de..."
                    autoCapitalize="characters"
                    autoFocus
                    maxLength={50}
                  />
                </View>

                <View>
                  <Text>Descripción</Text>
                  <TextInput
                    style={[styles.textInput, {height: 80, textAlignVertical: 'top'}]}
                    value={this.state.newLocation.description}
                    onChangeText={text => {
                      let {newLocation} = this.state;
                      newLocation = {
                        ...newLocation,
                        description: text
                      }
                      this.setState({newLocation});
                    }}
                    placeholder="Casa número..."
                    autoCapitalize="characters"
                    maxLength={150}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={{flexDirection: 'row-reverse', marginTop: 20}}>
                  <TouchableOpacity onPress={() => this.handleSaveLocation()} style={[styles.button, {backgroundColor: '#45B39D'}]}>
                    <Text style={{color: 'white'}}><Icon name="save" size={30} color="#fff" /> Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.setState({modalNewLocationShow: false, showMainMarker: false})} style={[styles.button, {backgroundColor: 'gray'}]}>
                    <Text style={{color: 'white'}}><Icon name="close" size={30} color="#fff" /> Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Botón de nueva ubicación */}
        {this.state.showMainMarker == false && this.state.showOptions == false && <View style={styles.floatBottonContainer}>
          <TouchableOpacity onPress={() => this.getCurrentLocation()} style={styles.floatBotton}>
            <Icon name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </View> }

        {/* Botón de aceptar ubicación */}
        {this.state.showMainMarker == true && this.state.showOptions == false && <View style={styles.floatBottonContainer}>
          <TouchableOpacity onPress={() => this.setState({modalNewLocationShow: true})} style={styles.floatBotton}>
            <Icon name="check" size={30} color="#fff" />
          </TouchableOpacity>
        </View> }
        
        <FlashMessage position="bottom" />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      // paddingHorizontal: 10
  },
  map: {
      height: screenHeight,
      width: screenWidth,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    borderRadius: 5
  },
  button: {
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10
  },
  floatBottonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1
  },
  floatBotton: {
    height: 60,
    width: 60,
    backgroundColor: '#45B39D',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30
  }
});

const SplashScreen = () => {
  return (
    <View style={ style.container }>
        <Image 
            source={require('./src/assets/images/icon.png')}
            style={style.logo}
            resizeMode="contain"
        />
        <Text style={style.title}>{env.appName}</Text>
        <View style={style.footer}>
            <Text style={style.footerText}>Powered by <Text style={style.footerTextAutor}>{env.autor}</Text></Text>
        </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'column',
    width: 200,
    height: 200,
    marginBottom: 10
  },
  title: {
    textAlign: 'center',
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom:10,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30
  },
  footerText: {
    textAlign: 'center',
    fontSize: 15,
  },
  footerTextAutor: {
    fontWeight: 'bold'
  }
});