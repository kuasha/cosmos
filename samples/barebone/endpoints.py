import tornado

from cosmos.datamonitor.monitor import ChangeMonitor, ChangeRequestHandler
from cosmos.service.auth import *
from cosmos.service.oauth2service import OAuth2ServiceHandler
from cosmos.service.search import SearchHandler
from cosmos.service.servicehandler import *
from cosmos.service.gridfsservice import *
from cosmos.service.appservice import *
import settings
from views import *

END_POINTS = [
    (r"/login/google/", GoogleOAuth2LoginHandler),
    (r"/login/openid/", OpenidLoginHandler),
    (r"/login/facebookgraph/", FacebookGraphLoginHandler),
    (r"/login/github/", GithubOAuth2LoginHandler),
    (r"/login/authp/", AuthpOAuth2LoginHandler),
    (r"/login/", LoginHandler),
    (r"/logout/", LogoutHandler),
    (settings.LOCAL_OAUTH2_SERVICE_URL, OAuth2ServiceHandler),
    (settings.AUTH_PUBLIC_KEY_PEM_URL, AuthPublicKeyHandler),
    (r"/oauth2client/(?P<function>[^\/]+)/", OAuth2DummyClientHandler),
    (r"/service/(.*)", ServiceHandler),
    (r"/search/(.*)/", SearchHandler),
    (r"/gridfs/(.*)", GridFSServiceHandler),
    (r"/application/install/", AppInstallHandler),
    (r"/application/package/(.*)", AppPackageHandler),
    #TODO: authenticaion and authorization required for change monitor and handler.
    (r"/changemonitor", ChangeMonitor),
    (r"/handlechange", ChangeRequestHandler),
    (r"/",  IndexHandler),
    (r'/(.*)', tornado.web.StaticFileHandler, {'path': settings.STATIC_PATH}),
]