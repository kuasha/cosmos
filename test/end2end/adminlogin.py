import tornado
import time
import random
import json
from threading import Thread

import tornado
import requests

import cosmos.datamonitor.monitor as monitor
import samples.barebone.cosmosmain as cosmosmain
from test import *


from django.utils.unittest.case import skip
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException, NoAlertPresentException
import unittest, re

class AdminLoginTest(LoggedTestCase):
    """
    @classmethod
    def service_thread(self, options):
        if options.start_web_service:
            cosmosmain.start_service(options)

        self.logger.info("Starting torando ioloop")
        tornado.ioloop.IOLoop.instance().start()
        self.logger.info("Tornado ioloop stopped")

    @classmethod
    def setUpClass(self):
        self.options = cosmosmain.get_options(8080)

        self.thread = Thread(target=self.service_thread, args=(self.options,))
        self.thread.start()
        time.sleep(5)

    @classmethod
    def stop_tornado(self):
        ioloop = tornado.ioloop.IOLoop.instance()
        ioloop.add_callback(lambda x: x.stop(), ioloop)
        self.logger.info("Stopping tornado ioloop")

    @classmethod
    def tearDownClass(self):
        monitor.continue_monitor = False
        self.stop_tornado()
        self.thread.join()
        time.sleep(10)
    """

    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(30)
        self.base_url = "http://localhost:8080/"
        self.verificationErrors = []
        self.accept_next_alert = True

    @skip("Incomplete")
    def test_admin_login(self):
        driver = self.driver
        driver.get("http://localhost:8080")
        driver.find_element_by_link_text("Login").click()
        driver.find_element_by_id("username").clear()
        driver.find_element_by_id("username").send_keys("admin")
        driver.find_element_by_id("password").clear()
        driver.find_element_by_id("password").send_keys("admin")
        driver.find_element_by_css_selector("input.btn.btn-primary").click()
        self.assertTrue(self.is_element_present(By.LINK_TEXT, "Logout [admin]"))
        driver.find_element_by_link_text("Logout [admin]").click()
        self.assertTrue(self.is_element_present(By.LINK_TEXT, "Login"))
    
    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException, e: return False
        return True
    
    def is_alert_present(self):
        try:
            self.driver.switch_to.alert()
        except NoAlertPresentException, e: return False
        return True
    
    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to.alert()
            alert_text = alert.text
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert_text
        finally: self.accept_next_alert = True
    
    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
