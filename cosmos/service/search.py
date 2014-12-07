"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from cosmos.service.utils import MongoObjectJSONEncoder
from cosmos.service import requesthandler
from cosmos.dataservice.objectservice import *


class SearchHandler(requesthandler.RequestHandler):

    @tornado.web.asynchronous
    @gen.coroutine
    def get(self, object_name):
        """
        Example:
        /search/cosmos.pages/?q=%22test%22&filter={%22type%22:%22page%22}&columns=title,createtime
        :param object_name:name of the object to search
        """

        #TODO: Unify with get service- just add the q parameter to the get

        q = self.get_argument("q", None, True)

        columns_str = self.get_argument("columns", None)
        filter_str = self.get_argument("filter", None)

        if filter_str:
            query = json.loads(filter_str)
        else:
            query = None

        if columns_str:
            columns = columns_str.split(',')
            columns = [column.strip() for column in columns]
        else:
            columns = []

        result_list = []

        if q:
            if query:
                query['$text'] = {'$search': q}
            else:
                query = {'$text': {'$search': q}}

            obj_serv = self.settings['object_service']

            cursor = obj_serv.text_search(self.current_user, object_name, query, columns)

            #TODO: use to_list to create list
            while(yield cursor.fetch_next):
                qry_result=cursor.next_object()
                result_list.append(qry_result)

        data = {"_d": MongoObjectJSONEncoder().encode(result_list), "_cosmos_service_array_result_": True}

        self.content_type = 'application/json'
        self.write(data)
        self.finish()

