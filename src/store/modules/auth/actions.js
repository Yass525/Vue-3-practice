let timer;

export default {
  async login(context, payload) {
    context.dispatch('auth', {
      ...payload,
      mode: 'login'
    });
  },

  async signup(context, payload) {
    context.dispatch('auth', {
      ...payload,
      mode: 'signup'
    });
  },


  async auth(context, payload) {
    const mode = payload.mode;
    let url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBWSx6FVjOnBkL_prWSIYo9M6e23S7QFFs';

    if (mode === 'signup') {
      url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBWSx6FVjOnBkL_prWSIYo9M6e23S7QFFs'
    }

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        returnSecureToken: true
      })
    })

    const resData = await response.json();

    if (!response.ok) {
      const error = new Error(resData.message || 'Failed to authenticate2.');
      throw error;
    }

    const expirationDate = new Date().getTime() + +resData.expiresIn * 1000;

    localStorage.setItem('token', resData.idToken);
    localStorage.setItem('userId', resData.localId);
    localStorage.setItem('tokenExpiration', expirationDate);

    timer = setTimeout(function() {
      context.dispatch('autoLogout');
    }, +resData.expiresIn * 1000);

    context.commit('setUser', {
      token: resData.idToken,
      userId: resData.localId,
    });
  },

  tryLogin(context) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    const expiresIn = +tokenExpiration - new Date().getTime();

    if (expiresIn < 0) {
      return;
    }

    setTimeout(function() {
      context.dispatch('autoLogout');
    },expiresIn)

    if (token && userId) {
      context.commit('setUser', {
        token: token,
        userId: userId,
      });
    }
  },

  logout(context) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('tokenExpiration');

    clearTimeout(timer);

    context.commit('setUser', {
      token: null,
      userId: null,
    });
  },

  autoLogout(context) {
    context.dispatch('logout');
    context.commit('setAutoLogout');
  }
};
