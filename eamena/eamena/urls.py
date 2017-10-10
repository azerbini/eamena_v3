'''
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
'''

from arches import urls as arches_urls
from django.conf.urls import patterns, url, include

uuid_regex = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

urlpatterns = patterns('',
    url(r'^search$', 'eamena.views.search.home_page', name="search_home"),
    url(r'^search/export$', 'eamena.views.search.export_results', name="search_results_export"),
    url(r'^search/resources$', 'eamena.views.search.search_results', name="search_results"),
    url(r'^reports/(?P<resourceid>%s)$' % uuid_regex , 'eamena.views.resources.report', name='report'),
    url(r'^resources/(?P<resourcetypeid>[0-9a-zA-Z_.]*)/(?P<form_id>[a-zA-Z_-]*)/(?P<resourceid>%s|())$' % uuid_regex, 'eamena.views.resources.resource_manager', name="resource_manager"),
    url(r'^resources/markers/(?P<entitytypeid>.*)$', 'eamena.views.resources.map_layers', {'get_centroids':True}, name="map_markers"),
    url(r'^admin/auth/user/(?P<userid>[0-9]*)/user_activity/$' , 'eamena.views.user_activity.user_activity', name='user_activity'),
    url(r'^admin/auth/group/(?P<groupid>[0-9]*)/group_activity/$' , 'eamena.views.group_activity.group_activity', name='user_activity'),

    
    url(r'', include(arches_urls)),
)

