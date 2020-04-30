/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import {Button, Text, View, Modal, TextInput} from 'react-native';
import ZoomUsSdk from 'react-native-zoom-us-sdk';
import jwt from 'react-native-pure-jwt';

const JwtApiKey = 'Replace this with your JWT API Key';
const JwtApiSecret = 'Replace this with your JWT API Secret';
const SdkApiKey = 'Replace this with your SDK API Key';
const SdkApiSecret = 'Replace this with your SDK API Secret';

export default class App extends Component {
  state = {
    userId: 'eslam.elmeniawy@roqay.com.kw',
    jwtAccessToken: null,
    zoomToken: null,
    zoomAccessToken: null,
    initializeResult: null,
    startResult: null,
    inMeetingDialogVisible: false,
    meetingNumber: null,
    meetingPassword: null,
    type: null,
  };

  componentDidMount() {
    this._initializeZoom();
  }

  render() {
    return (
      <View>
        <Text style={{marginVertical: 20}}>
          {this.state.initializeResult &&
            `initializeResult::${JSON.stringify(this.state.initializeResult)}`}
        </Text>

        <Button title="Start Meeting" onPress={this._getJwtAccessToken} />

        <Text style={{marginVertical: 20}}>
          {this.state.startResult &&
            `startResult::${JSON.stringify(this.state.startResult)}`}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginVertical: 20,
          }}>
          <TextInput
            style={{
              borderColor: 'gray',
              borderWidth: 1,
              width: '40%',
              height: 40,
            }}
            onChangeText={text => this.setState({meetingNumber: text})}
            value={this.state.meetingNumber}
            placeholder="Meeting Number"
          />
          <TextInput
            style={{
              borderColor: 'gray',
              borderWidth: 1,
              width: '40%',
              height: 40,
            }}
            onChangeText={text => this.setState({meetingPassword: text})}
            value={this.state.meetingPassword}
            placeholder="Meeting Password"
          />
        </View>

        <Button title="Join Meeting" onPress={this._joinZoomMeeting} />

        <Modal
          animationType="slide"
          transparent
          visible={this.state.inMeetingDialogVisible}>
          <View
            style={{
              margin: 20,
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
            <Text style={{marginBottom: 20}}>
              You are already in active meeting
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Button
                title="Return to Meeting"
                onPress={this._returnToCurrentMeeting}
              />

              <Button
                title="Leave Meeting"
                onPress={this._leaveCurrentMeeting}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  _initializeZoom = async () => {
    try {
      const initializeResult = await ZoomUsSdk.initializeZoom(
        SdkApiKey,
        SdkApiSecret,
        'zoom.us',
      );

      console.log('initializeResult', initializeResult);
      this.setState({initializeResult});
    } catch (exception) {
      console.error('Error initialize zoom', exception);
    }
  };

  _getJwtAccessToken = () => {
    jwt
      .sign(
        {
          iss: JwtApiKey,
          exp: new Date().getTime() + 3600 * 1000,
          additional: 'payload',
        },
        JwtApiSecret,
        {
          alg: 'HS256',
        },
      )
      .then(token => {
        console.log('jwtAccessToken', token);
        this.setState({jwtAccessToken: token}, () => this._getZoomToken());
      })
      .catch(console.error);
  };

  _getZoomToken = () => {
    const request = new XMLHttpRequest();

    request.onreadystatechange = e => {
      if (request.readyState !== 4) {
        return;
      }

      if (request.status === 200) {
        const zoomToken = JSON.parse(request.responseText).token;
        console.log('zoomToken', zoomToken);
        this.setState({zoomToken}, () => this._getZoomAccessToken());
      } else {
        console.warn('error');
      }
    };

    request.open(
      'GET',
      `https://api.zoom.us/v2/users/${
        this.state.userId
      }/token?type=token&access_token=${this.state.jwtAccessToken}`,
    );

    request.send();
  };

  _getZoomAccessToken = () => {
    const request = new XMLHttpRequest();

    request.onreadystatechange = e => {
      if (request.readyState !== 4) {
        return;
      }

      if (request.status === 200) {
        const zoomAccessToken = JSON.parse(request.responseText).token;
        console.log('zoomAccessToken', zoomAccessToken);
        this.setState({zoomAccessToken}, () => this._startZoomMeeting());
      } else {
        console.warn('error');
      }
    };

    request.open(
      'GET',
      `https://api.zoom.us/v2/users/${
        this.state.userId
      }/token?type=zak&access_token=${this.state.jwtAccessToken}`,
    );

    request.send();
  };

  _startZoomMeeting = async () => {
    try {
      const startResult = await ZoomUsSdk.startMeeting(
        this.state.jwtAccessToken,
        this.state.zoomToken,
        this.state.zoomAccessToken,
        'meeting_123',
        this.state.userId,
        'Eslam El-Meniawy',
      );

      console.log('startResult', startResult);
      this.setState({startResult});
    } catch (exception) {
      if (exception.code === 'ERR_ZOOM_IN_MEETING') {
        console.warn(exception);
        this.setState({inMeetingDialogVisible: true, type: 'start'});
      } else {
        console.error('Error start meeting', exception);
      }
    }
  };

  _returnToCurrentMeeting = () => {
    this.setState({inMeetingDialogVisible: false}, async () => {
      try {
        const returnToMeetingResult = await ZoomUsSdk.returnToCurrentMeeting();
        console.log('returnToMeetingResult', returnToMeetingResult);
      } catch (exception) {
        console.error('Error returning to current meeting', exception);
      }
    });
  };

  _leaveCurrentMeeting = () => {
    this.setState({inMeetingDialogVisible: false}, async () => {
      try {
        const leaveMeetingResult = await ZoomUsSdk.leaveCurrentMeeting();
        console.log('leaveMeetingResult', leaveMeetingResult);

        if (this.state.type === 'start') {
          setTimeout(this._startZoomMeeting, 1000);
        }

        if (this.state.type === 'join') {
          setTimeout(this._joinZoomMeeting, 1000);
        }
      } catch (exception) {
        console.error('Error leaving current meeting', exception);
      }
    });
  };

  _joinZoomMeeting = async () => {
    try {
      const joinResult = await ZoomUsSdk.joinMeeting(
        this.state.meetingNumber,
        this.state.meetingPassword,
        'Eslam El-Meniawy',
      );

      console.log('joinResult', joinResult);
    } catch (exception) {
      if (exception.code === 'ERR_ZOOM_IN_MEETING') {
        console.warn(exception);
        this.setState({inMeetingDialogVisible: true, type: 'join'});
      } else {
        console.error('Error join meeting', exception);
      }
    }
  };
}
