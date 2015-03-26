# noinspection PyStatementEffect
{
    'name': "Web Ace Editor",
    'version': '0.1',
    'depends': ['base'],
    'author': "Yusnel Rojas Garcia",
    'website': "http://localhost/",
    'category': 'Tools',
    'description': """
    Allow to edit code
    """,
    # data files always loaded at installation
    'data': [
        'views/assets.xml',
    ],
    # data files containing optionally loaded demonstration data
    # 'demo': [
    #    'demo/data.xml',
    #],
    'qweb': [ 'static/src/xml/templates.xml' ],
    'js': [
        # 'static/lib/require.js',
        # 'static/src/js/ace.js',
    ],
    #'images': [ 'static/src/img/image1.png' ],
    'installable': True,
    'application': True,
}